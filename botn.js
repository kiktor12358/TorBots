const mc = require('minecraft-protocol');
const socks = require('socks').SocksClient;
const mineflayer = require("mineflayer");
const { pathfinder, Movements } = require('mineflayer-pathfinder');
const { GoalNear } = require('mineflayer-pathfinder').goals
const armorManager = require("mineflayer-armor-manager");
const mineflayerPvp = require('mineflayer-pvp').plugin;
const Vec3 = require('vec3');
const crafter = require("mineflayer-crafting-util").plugin

// Получаем параметры из командной строки
const proxy = process.argv[2]; // Прокси в формате ip:port
const hostt = process.argv[3]; // Хост сервера
const portt = parseInt(process.argv[4]); // Порт сервера
const spamm = process.argv[5]; // Сообщение для спама
const disableFF = process.argv[6] === 'true'; // Отключить FF (теперь true значит включено)
const suffix = process.argv[7] || ''; // Суффикс
const breaker = process.argv[8] === 'true'; // Функция включения слома блоков
const walkToGoalEnabled = process.argv[9] === 'true'; // Функция включения перехода на координаты
const goalCoordinates = process.argv[10] || ''; // Координаты
const Mineflayerpvp = process.argv[11] === 'true'; // AI PVP мод
const barrelCarrySword = process.argv[12] === 'true'; // Брать меч из бочки


let pvpInterval = null;
let isBreaking = false;

// Разделяем прокси на хост и порт
const proxyParts = proxy.split(':');
const proxyHost = proxyParts[0]; // Хост прокси
const proxyPort = parseInt(proxyParts[1]); // Порт прокси

let bot;

function generateRandomUsername(length) {
  const characters = 'abcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }
  // Добавляем суффикс если FF включен
  if (disableFF && suffix) {
    result += suffix;
  }
  return result;
}

function createBot() {
  const username = generateRandomUsername(7); // Генерация случайного имени из 6 букв
  const client = mc.createClient({
    connect: client => {
      socks.createConnection({
        proxy: {
          host: proxyHost,
          port: proxyPort,
          type: 5,
          //userId: proxyuser,
          //password: proxypass
        },
        command: 'connect',
        destination: {
          host: hostt,
          port: portt
        }
      }, (err, info) => {
        if (err) {
          console.log(err);
          process.exit(0)
        }

        client.setSocket(info.socket);
        client.emit('connect');
      });
    },
    username: username,
  });

  bot = mineflayer.createBot({
    client: client
  });

  bot.loadPlugin(pathfinder);
  bot.loadPlugin(armorManager);
  if (Mineflayerpvp) bot.loadPlugin(mineflayerPvp);
  bot.loadPlugin(crafter)

  bot.on('login', async () => {
    console.log(`Бот ${username} на сервере!`);
    bot.chat('/register 789654123 789654123')
    bot.chat('/login 789654123')

    // СНАЧАЛА экипировка из бочки (если включено)
    if (barrelCarrySword) {
      await takeItemsFromBarrel(bot);
    }
    // Только после экипировки — все остальные действия:

    if (walkToGoalEnabled && goalCoordinates) {
      const coords = goalCoordinates.split('_').map(Number);
      if (coords.length === 3 && !coords.some(isNaN)) {
        const [x, y, z] = coords;
        try {
          await bot.pathfinder.goto(new GoalNear(x, y, z, 1));
        } catch (err) {
          console.error(`Не удалось дойти до цели: ${err.message}`);
        }
      }
    }
    if (Mineflayerpvp) {
      setInterval(() => {
        const entity = bot.nearestEntity(e => {
          if (!e.name) return false;
          if (e.name.toLowerCase().includes('item')) return false;
          if (e.name.toLowerCase().includes('experience_orb')) return false;
          if (e.name.toLowerCase().includes('arrow')) return false;
          if (suffix && e.username && e.username.toLowerCase().endsWith(suffix.toLowerCase())) return false;
          return e !== bot.entity;
        });
        if (entity) {
          bot.pvp.attack(entity);
        }
      }, 750);
      // Каждые 5 секунд брать меч в руку
      setInterval(() => {
        const sword = bot.inventory.items().find(item => item.name.includes('sword'));
        if (sword) {
          bot.equip(sword, 'hand').catch(() => {});
        }
      }, 5000);
    } else {
      lockk();
    }
    pvpstart();
    comspam();
    if (breaker) breakerLogic();
    setTimeout(() => {
      spam()
    }, 2000);
  });
  bot.on('kicked', reason => {
    console.log(`Бот был выкинут с сервера: ${reason}.`);
    process.exit(0)
  });

  bot.on('end', () => {
    console.log('Отключение от сервера. Попытка переподключения...');
    process.exit(0)
  });

  bot.on('error', err => {
    console.log('Ошибка бота:', err);
    // Обработка ошибки и попытка переподключения
    if (err.code === 'ECONNRESET' || err.code === 'EPIPE') {
      console.log('Соединение сброшено. Попытка переподключения...');
      process.exit(0)
    }
  });
}

function reconnect() {
  setTimeout(() => {
    console.log('Переподключение...');
    createBot(); // Вызов функции создания бота для переподключения
  }, 8000); // Ожидание 8 секунд перед переподключением
}

// Запуск бота
createBot();

function pvpstart() {
  bot.setControlState('forward', true);
  bot.setControlState('jump', true);
  bot.setControlState('sprint', true);
}

function stopPvp() {
  bot.clearControlStates()
}

function lockk() {
  if (pvpInterval) clearInterval(pvpInterval)
  pvpInterval = setInterval(() => {
    // Ищем ближайшую сущность, исключая только предметы
    const entity = bot.nearestEntity(entity => {
      if (entity.name && entity.name.toLowerCase().includes('item')) {
        return false;
      }
      if (entity.name && entity.name.toLowerCase().includes('experience_orb')) {
        return false;
      }
      
      // Проверяем суффикс только если FF включен
      if (disableFF && suffix && entity.username) {
        // Игнорируем игроков с указанным суффиксом
        if (entity.username.toLowerCase().endsWith(suffix.toLowerCase())) {
          return false;
        }
      }
      
      return entity !== bot.entity && // Исключаем самого бота
             entity.username !== bot.username
    });
    
    if (!entity) return;
    const distance = bot.entity.position.distanceTo(entity.position);
    bot.lookAt(entity.position.offset(0, entity.height, 0), true);
    
    if (distance <= 4) {
      bot.lookAt(entity.position.offset(0, entity.height, 0), true);
      bot.attack(entity);
    }
  }, 750);
}

function spam() {
    setInterval(() => {
        bot.chat(spamm)
}, 5000);
}

function comspam() {
  const spamcom = generateRandomUsername(6)
  setTimeout(() => {
    setInterval(() => {
      bot.chat('/' + spamcom)
    }, 2500);
  }, 8000);
}

async function breakerLogic() {
  console.log('Breaker logic activated.')
  const breakBlocks = [ //можно добавить свои блоки, но это повлияет на нагрузку ботов
    'chest'
  ];

  let isBreaking = false;

  setInterval(async () => {
    if (isBreaking) return

    let foundBlock = null;
    for (const blockName of breakBlocks) {
      const blockType = bot.registry.blocksByName[blockName];
      if (!blockType) continue;
      const block = bot.findBlock({
        matching: blockType.id,
        maxDistance: 16,
        useExtraInfo: true
      });
      if (block) {
        foundBlock = block;
        break;
      }
    }

    if (foundBlock) {
      isBreaking = true
      if (pvpInterval) clearInterval(pvpInterval)
      stopPvp()
      try {
        await bot.pathfinder.goto(new GoalNear(foundBlock.position.x, foundBlock.position.y, foundBlock.position.z, 1))
        await bot.dig(foundBlock)
      } catch (err) {
        console.log('Не удалось сломать блок:', err.message)
      }
      console.log('Возвращаюсь к PvP.')
      pvpstart()
      lockk()
      isBreaking = false
    }
  }, 5000) // Проверяем каждые 5 секунд
}

// --- Функция для взятия меча и кирки из бочки ---
async function takeItemsFromBarrel(bot) {
  try {
    let barrelBlock = null;
    // Ждём, пока бочка не появится в зоне видимости
    for (let i = 0; i < 60; i++) { // 60 попыток, ~2 минуты
      barrelBlock = bot.findBlock({
        matching: block => block.name === 'barrel',
        maxDistance: 64
      });
      if (barrelBlock) break;
      await new Promise(res => setTimeout(res, 2000)); // Ждём 2 секунды
    }
    if (barrelBlock) {
      await bot.pathfinder.goto(new GoalNear(barrelBlock.position.x, barrelBlock.position.y, barrelBlock.position.z, 1));
      const barrel = await bot.openContainer(barrelBlock);
      // Ищем первый меч и первую кирку в бочке
      const swordItem = barrel.containerItems().find(item => item.name.includes('sword'));
      const pickaxeItem = barrel.containerItems().find(item => item.name.includes('pickaxe'));
      // Забираем только один меч
      if (swordItem) {
        if (bot.inventory.emptySlotCount() === 0) {
          // (лог заполненности инвентаря удалён)
        }
        try {
          await barrel.withdraw(swordItem.type, null, 1);
        } catch (e) {}
        await new Promise(resolve => {
          const timeout = setTimeout(resolve, 1000);
          bot.once('windowClose', () => {
            clearTimeout(timeout);
            resolve();
          });
        });
        await bot.waitForTicks(10);
        let invSword = bot.inventory.items().find(item => item.name.includes('sword'));
        if (!invSword) invSword = bot.inventory.items().find(item => item.type === swordItem.type);
        if (invSword) {
          try {
            await bot.equip(invSword, 'hand');
          } catch (e) {}
        }
      }
      // Забираем только одну кирку (если есть)
      if (pickaxeItem) {
        if (bot.inventory.emptySlotCount() === 0) {
          // (лог заполненности инвентаря удалён)
        }
        try {
          await barrel.withdraw(pickaxeItem.type, null, 1);
        } catch (e) {}
        await bot.waitForTicks(10);
        let invPickaxe = bot.inventory.items().find(item => item.name.includes('pickaxe'));
        if (!invPickaxe) invPickaxe = bot.inventory.items().find(item => item.type === pickaxeItem.type);
      }
      await barrel.close();
    } else {
      console.log('Бочка не найдена рядом (даже после ожидания).');
    }
  } catch (e) {
    console.log('Ошибка при взятии предметов из бочки:', e.message);
  }
}
// --- Конец функции ---

