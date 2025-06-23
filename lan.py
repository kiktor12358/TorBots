import subprocess
import time
import customtkinter as ctk
from threading import Thread
import socket

ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("dark-blue")

def change_tor_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.connect(("127.0.0.1", 9051))
        s.send("AUTHENTICATE \"\"\n".encode()) # Если требуется аутентификация
        s.recv(1024)
        s.send("SIGNAL NEWNYM\n".encode())
        s.recv(1024)
        s.close()
        print("IP address changed successfully.")
    except Exception as e:
        print(f"Error changing IP: {e}")


class BotLauncher:
    def __init__(self, master):
        self.master = master
        master.title("Minecraft Bot Launcher")
        master.geometry("400x600")

        # Поля для ввода IP:Port сервера
        self.label_server = ctk.CTkLabel(master, text="Сервер IP:Port (формат: ip:port):")
        self.label_server.pack(pady=(20, 0))
        self.entry_server = ctk.CTkEntry(master)
        self.entry_server.pack(pady=5)

        # Поля для сообщения
        self.label_message = ctk.CTkLabel(master, text="Сообщение:")
        self.label_message.pack(pady=(10, 0))
        self.entry_message = ctk.CTkEntry(master)
        self.entry_message.pack(pady=5)

        # Галочка "Отключить FF"
        self.disable_ff_var = ctk.BooleanVar()
        self.disable_ff_checkbox = ctk.CTkCheckBox(master, text="Отключить FF", variable=self.disable_ff_var, command=self.toggle_suffix_field)
        self.disable_ff_checkbox.pack(pady=5)
        
        self.enable_pvp_var = ctk.BooleanVar()
        self.enable_pvp_checkbox = ctk.CTkCheckBox(master, text="Включить интелектуальное PVP", variable=self.enable_pvp_var)
        self.enable_pvp_checkbox.pack(pady=5)


        # Галочка "Включить ломание сундуков"
        self.breaker_var = ctk.BooleanVar()
        self.breaker_checkbox = ctk.CTkCheckBox(master, text="Включить ломание сундуков", variable=self.breaker_var)
        self.breaker_checkbox.pack(pady=5)

        # Галочка "Прийти по xyz"
        self.walk_to_goal_var = ctk.BooleanVar()
        self.walk_to_goal_checkbox = ctk.CTkCheckBox(master, text="Прийти по xyz", variable=self.walk_to_goal_var, command=self.toggle_coords_field)
        self.walk_to_goal_checkbox.pack(pady=5)

        # Поля для суффикса (изначально скрыто)
        self.label_suffix = ctk.CTkLabel(master, text="Введите суффикс:")
        self.entry_suffix = ctk.CTkEntry(master)

        # Поля для координат (изначально скрыто)
        self.label_coords = ctk.CTkLabel(master, text="Введите координаты (x y z):")
        self.entry_coords = ctk.CTkEntry(master)

        # Кнопка для запуска ботов
        self.start_button = ctk.CTkButton(master, text="Запустить ботов", command=self.start_bots)
        self.start_button.pack(pady=20)

        # Кнопка для остановки ботов
        self.stop_button = ctk.CTkButton(master, text="Остановить ботов", command=self.stop_bots)
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

    def run_bot(self, server, message, disable_ff, suffix, breaker_enabled, walk_to_goal_enabled, goal_coordinates, enable_pvp):
        command = [
            "node", "botn.js", 
            "127.0.0.1:9050",  # Прокси по умолчанию
            server.split(':')[0],  # IP сервера
            server.split(':')[1],  # Порт сервера
            message,  # Сообщение
            'true' if disable_ff else 'false',  # Отключить FF
            suffix if suffix else "",  # Суффикс
            'true' if breaker_enabled else 'false',  # Включить ломание сундуков
            'true' if walk_to_goal_enabled else 'false', # Включить ходьбу
            goal_coordinates, # Координаты
            'true' if enable_pvp else 'false' # Включить PVP
        ]
        print(f"Команда для запуска бота: {command}")
        process = subprocess.Popen(command)
        self.bot_processes.append(process)

    def start_bots(self):
        server = self.entry_server.get().strip()  # Получаем сервер
        message = self.entry_message.get().strip()  # Получаем сообщение
        disable_ff = self.disable_ff_var.get()  # Получаем состояние галочки
        suffix = self.entry_suffix.get().strip() if self.disable_ff_var.get() else ""  # Получаем суффикс
        breaker_enabled = self.breaker_var.get()  # Получаем состояние галочки ломания сундуков
        walk_to_goal_enabled = self.walk_to_goal_var.get()
        goal_coordinates = self.entry_coords.get().strip().replace(' ', '_') if walk_to_goal_enabled else "0_0_0"
        enable_pvp = self.enable_pvp_var.get()

        self.running = True  # Устанавливаем флаг запуска
        bot_thread = Thread(target=self.run_bots, args=(server, message, disable_ff, suffix, breaker_enabled, walk_to_goal_enabled, goal_coordinates, enable_pvp))
        bot_thread.start()

    def run_bots(self, server, message, disable_ff, suffix, breaker_enabled, walk_to_goal_enabled, goal_coordinates, enable_pvp):
        while self.running:
            self.run_bot(server, message, disable_ff, suffix, breaker_enabled, walk_to_goal_enabled, goal_coordinates, enable_pvp)
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
root = ctk.CTk()
app = BotLauncher(root)
root.mainloop()
