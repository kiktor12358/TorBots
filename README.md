# TorBots
![](https://komarev.com/ghpvc/?username=kiktor12358)

Боты на Node js использующие tor для ддос-а майнкрафт серверов

# Об программе
TorBots - это боты minecraft использующие tor сеть для атак на сервера майнкрафт.
В функционал ботов входит:

• **2 Режима** боевки ботов

• Могут **гриферить дома**

• Используют tor сеть как прокси, что позволяет обходить баны

В данный момент гайд по установке есть только на линукс! на windows надо установить python и node js 18 версии и после открывать файл lan.py

**⚠️ПРЕДУПРЕЖДЕНИЕ: Боты достаточно сильно могут нагружать ваш компьютер в зависимости от настроек, немного ботов запустить можно но слишком большое количество не стоит⚠️**

# Установка
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