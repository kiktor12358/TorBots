# TorBots
![](https://komarev.com/ghpvc/?username=kiktor12358)

Боты на Node js использующие tor для дос-а майнкрафт серверов

# Об программе
TorBots - это боты minecraft использующие tor сеть для атак на сервера майнкрафт.
В функционал ботов входит:

• **2 Режима** боевки ботов

• Могут **гриферить дома**

• Используют tor сеть как прокси, что позволяет обходить баны

• Могут **брать экипирвку** из бочки при спавне


**⚠️ПРЕДУПРЕЖДЕНИЕ: Боты достаточно сильно могут нагружать ваш компьютер в зависимости от настроек. На слабых компьютерах рекомендую ограничивать количество ботов⚠️**

# Установка

**В данный момент гайд и сама программа были сделаны под линукс. Для windows будет все по другому и я не гарантирую то что все может работать на windows**


Устанавливаем pip:

для arch
```
sudo pacman -S python-pip
```
для debian
```
sudo apt install python-pip
```


после установки pip скачиваем библиотеку:
```
pip3 install customtkinter --break-system-packages
```

также надо установить tor:

arch:
```
sudo pacman -S tor obfs4proxy
```
debian:
```
sudo apt install tor obfs4proxy
```

Также если вы из России то вам нужно настроить obfs4 мосты (смотрите другие гайды)


Для того чтоб все боты были с разными IP в tor сети нужно будет настроить ротацию:
```
sudo nano /etc/tor/torrc
```

ищем строку #ControlPort 9050 и раскоментируем вот так
```
## The port on which Tor will listen for local connections from Tor
## controller applications, as documented in control-spec.txt.
ControlPort 9051
```

после перезагружаем службу
```
sudo systemctl restart tor
```
можно также добавить службу tor в автозапуск
```
sudo systemctl enable tor
```

теперь выдаем права start.sh
```
chmod +x start.sh
```

И запускаем его через консоль командой ./start.sh