import subprocess
import time
import tkinter as tk
from tkinter import scrolledtext
from threading import Thread
import socket

def change_tor_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.connect(("127.0.0.1", 9051))
        s.send("AUTHENTICATE \"\"\n".encode()) # Если требуется аутентификация
        s.recv(1024)
        s.send("SIGNAL NEWNYM\n".encode())
        s.recv(1024)
        s.close()
    except Exception as e:
        print(f"Error changing IP: {e}")


class BotLauncher:
    def __init__(self, master):
        self.master = master
        master.title("Minecraft Bot Launcher")

        # Поля для ввода IP:Port сервера
        self.label_server = tk.Label(master, text="Сервер IP:Port (формат: ip:port):")
        self.label_server.pack()

        self.entry_server = tk.Entry(master)
        self.entry_server.pack(pady=5)

        # Поля для игнорируемых игроков
        self.label_ignore_player = tk.Label(master, text="Игнорируемые игроки (через запятую):")
        self.label_ignore_player.pack()

        self.entry_ignore_player = tk.Entry(master)
        self.entry_ignore_player.pack(pady=5)

        # Поля для сообщения
        self.label_message = tk.Label(master, text="Сообщение:")
        self.label_message.pack()

        self.entry_message = tk.Entry(master)
        self.entry_message.pack(pady=5)

        # Галочка "Отключить FF"
        self.disable_ff_var = tk.BooleanVar()
        self.disable_ff_checkbox = tk.Checkbutton(master, text="Отключить FF", variable=self.disable_ff_var, command=self.toggle_suffix_field)
        self.disable_ff_checkbox.pack(pady=5)

        # Галочка "Включить ломание сундуков"
        self.breaker_var = tk.BooleanVar()
        self.breaker_checkbox = tk.Checkbutton(master, text="Включить ломание сундуков", variable=self.breaker_var)
        self.breaker_checkbox.pack(pady=5)

        # Галочка "Прийти по xyz"
        self.walk_to_goal_var = tk.BooleanVar()
        self.walk_to_goal_checkbox = tk.Checkbutton(master, text="Прийти по xyz", variable=self.walk_to_goal_var, command=self.toggle_coords_field)
        self.walk_to_goal_checkbox.pack(pady=5)

        # Поля для суффикса (изначально скрыто)
        self.label_suffix = tk.Label(master, text="Введите суффикс:")
        self.entry_suffix = tk.Entry(master)

        # Поля для координат (изначально скрыто)
        self.label_coords = tk.Label(master, text="Введите координаты (x y z):")
        self.entry_coords = tk.Entry(master)

        # Кнопка для запуска ботов
        self.start_button = tk.Button(master, text="Запустить ботов", command=self.start_bots)
        self.start_button.pack(pady=20)

        # Кнопка для остановки ботов
        self.stop_button = tk.Button(master, text="Остановить ботов", command=self.stop_bots)
        self.stop_button.pack(pady=5)

        # Хранение процессов ботов
        self.bot_processes = []
        self.running = False  # Флаг для управления запуском ботов

    def toggle_suffix_field(self):
        if self.disable_ff_var.get():
            self.label_suffix.pack()
            self.entry_suffix.pack(pady=5)
        else:
            self.label_suffix.pack_forget()
            self.entry_suffix.pack_forget()

    def toggle_coords_field(self):
        if self.walk_to_goal_var.get():
            self.label_coords.pack()
            self.entry_coords.pack(pady=5)
        else:
            self.label_coords.pack_forget()
            self.entry_coords.pack_forget()

    def run_bot(self, server, ignore_players, message, disable_ff, suffix, breaker_enabled, walk_to_goal_enabled, goal_coordinates):
        # Используем прокси 127.0.0.1:9050 по умолчанию
        command = [
            "node", "botn.js", 
            "127.0.0.1:9050",  # Прокси по умолчанию
            server.split(':')[0],  # IP сервера
            server.split(':')[1],  # Порт сервера
            ignore_players,  # Игнорируемые игроки
            message,  # Сообщение
            'true' if disable_ff else 'false',  # Отключить FF
            suffix if suffix else "",  # Суффикс
            'true' if breaker_enabled else 'false',  # Включить ломание сундуков
            'true' if walk_to_goal_enabled else 'false', # Включить ходьбу
            goal_coordinates # Координаты
        ]
        
        process = subprocess.Popen(command)
        self.bot_processes.append(process)

    def start_bots(self):
        server = self.entry_server.get().strip()  # Получаем сервер
        ignore_players = self.entry_ignore_player.get().strip()  # Получаем игнорируемых игроков
        message = self.entry_message.get().strip()  # Получаем сообщение
        disable_ff = self.disable_ff_var.get()  # Получаем состояние галочки
        suffix = self.entry_suffix.get().strip() if self.disable_ff_var.get() else ""  # Получаем суффикс
        breaker_enabled = self.breaker_var.get()  # Получаем состояние галочки ломания сундуков
        walk_to_goal_enabled = self.walk_to_goal_var.get()
        goal_coordinates = self.entry_coords.get().strip().replace(' ', '_') if walk_to_goal_enabled else "0_0_0"

        self.running = True  # Устанавливаем флаг запуска
        bot_thread = Thread(target=self.run_bots, args=(server, ignore_players, message, disable_ff, suffix, breaker_enabled, walk_to_goal_enabled, goal_coordinates))
        bot_thread.start()

    def run_bots(self, server, ignore_players, message, disable_ff, suffix, breaker_enabled, walk_to_goal_enabled, goal_coordinates):
        while self.running:
            self.run_bot(server, ignore_players, message, disable_ff, suffix, breaker_enabled, walk_to_goal_enabled, goal_coordinates)
            print(f"Запущен бот с прокси: 127.0.0.1:9050")
            change_tor_ip()
            time.sleep(3)  # Ждем 3 секунды перед запуском следующего бота

    def stop_bots(self):
        self.running = False  # Сбрасываем флаг запуска
        for process in self.bot_processes:
            process.terminate()  # Завершаем все запущенные процессы
        self.bot_processes.clear()  # Очищаем список процессов
        print("Все боты остановлены.")

# Создание GUI
root = tk.Tk()
app = BotLauncher(root)
root.mainloop()
