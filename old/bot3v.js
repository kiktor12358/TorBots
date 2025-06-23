const mc = require('minecraft-protocol');
const socks = require('socks').SocksClient;
const mineflayer = require("mineflayer");
const { pathfinder, Movements } = require('mineflayer-pathfinder');
const { GoalNear } = require('mineflayer-pathfinder').goals
const armorManager = require("mineflayer-armor-manager");
// Получаем параметры из командной строки
const proxy = process.argv[2]; // Прокси в формате ip:port
const hostt = process.argv[3]; // Хост сервера
const portt = parseInt(process.argv[4]); // Порт сервера
const ignorePlayers = process.argv[5]; // Игнорируемые игроки
const spamm = process.argv[6]; // Сообщение для спама
const disableFF = process.argv[7] === 'true'; // Отключить FF
const suffix = process.argv[8] || ''; // Суффикс

const breaker = process.argv[9] === 'true';
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
  // Если включен режим "Отключить FF" и есть суффикс, добавляем его к имени
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
  

  bot.on('login', reason => {
    console.log(`Бот ${username} на сервере!`);
    bot.chat('/register 789654123 789654123')
    bot.chat('/login 789654123')
    lockk();
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
      
      // Если включен режим "Отключить FF" и есть суффикс
      if (disableFF && suffix && entity.username) {
        // Игнорируем игроков с указанным суффиксом
        if (entity.username.toLowerCase().endsWith(suffix.toLowerCase())) {
          return false;
        }
      }
      
      return entity !== bot.entity && // Исключаем самого бота
             entity.username !== bot.username
             //entity.type !== 'player'
    });
    
    if (!entity) return;
    //console.log(`Атакуем сущность: ${entity.name || entity.type}`);
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
  setInterval(async () => {
    if (isBreaking) return

    const chest = bot.findBlock({
      matching: bot.registry.blocksByName.chest.id,
      maxDistance: 16,
      useExtraInfo: true
    })

    if (chest) {
      isBreaking = true
      clearInterval(pvpInterval)
      stopPvp()

      try {
        await bot.pathfinder.goto(new GoalNear(chest.position.x, chest.position.y, chest.position.z, 1))
        await bot.dig(chest)
      } catch (err) {
        console.log('Не удалось сломать сундук:', err.message)
      }

      console.log('Возвращаюсь к PvP.')
      pvpstart()
      lockk()
      isBreaking = false
    }
  }, 5000) // Check for chests every 5 seconds
}
