# TorBots
![](https://komarev.com/ghpvc/?username=kiktor12358)
Боты на Node js использующие tor для ддос-а майнкрафт серверов

# Об программе
TorBots - это боты minecraft использующие tor сеть для атак на сервера майнкрафт.
В функционал ботов входит:

**2 Режима** боевки ботов
Могут **гриферить дома**
Используют tor сеть как прокси, что позволяет обходить баны


# Установка
Для использования ботов достаточно установить Py библеотеку для работы панели

```
pip3 install customtkinter --break-system-packages
```
также надо установить tor

arch:
```
sudo pacman -S tor obfs4proxy
```
debian:
```
sudo apt install tor obfs4proxy
```

Также если вы из России то вам нужно настроить obfs мосты.

Для того чтоб все боты были с разными прокси нужно будет настроить ротацию:
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

теперь выдаем права start.sh
```
chmod +x start.sh
```

И запускаем его через консоль или просто нажатием