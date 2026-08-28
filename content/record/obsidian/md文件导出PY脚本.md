---
title: md文件导出PY脚本
date: 2026-08-08 18:40:30
lastmod: 2026-08-28
---

# 脚本说明
## 简介
本脚本旨在解决 Obsidian 笔记在脱离当前环境（Vault）后，图片和附件丢失或无法显示的问题。它不仅可以把笔记渲染成带有 Obsidian 风格的 HTML，还支持直接导出为 PDF 或 PNG 长图，非常适合用于分享或归档。
## 核心功能
*   **多格式导出**：支持将 Markdown 笔记导出为 **HTML**、**PDF** 和 **PNG**。
*   **智能附件处理**：
    *   自动全库解析：自动寻找 `.obsidian` 目录，精准找回笔记引用的图片和附件。
    *   内联图片：默认将图片直接转为 Base64 编码内嵌到生成的 HTML 中，实现“单文件分享”。
    *   分离打包：支持将附件单独提取到文件夹，或直接打包成 ZIP 压缩包。
*   **高度保留排版**：内置了仿 Obsidian 界面的 CSS 样式表和 Markdown 扩展解析，最大程度还原你在阅读视图下的体验。
*   **并发加速处理**：后台采用多线程处理，支持批量导出多个笔记而不会让界面卡顿。
*   **图形界面与命令行双支持**：既有现代化的可视化拖拽 UI 界面，也支持通过命令行（终端）参数进行自动化批处理。
## 环境与依赖
使用该工具前，需要确保你的 Python 环境中安装了以下库：
```powershell
pip install markdown tkinterdnd2 pyinstaller
```
*   `markdown`：用于将 Markdown 文本解析为 HTML。
*   `tkinterdnd2`：用于在图形界面中支持文件/文件夹的“拖拽”功能。
*   `pyinstaller`：用于将该脚本打包为无需 Python 环境即可独立运行的 `.exe` 软件。
## 使用方法
#### 方式一：使用图形界面 (GUI) - 推荐
最简单的方式是直接运行该脚本（如果在 Windows 环境，将打包好的 `exe` 直接双击打开即可，或者在终端运行）：
```powershell
python obsidian_exporter.py
```
启动后会弹出一个界面：
1. **添加文件**：你可以直接将需要的 `.md` 文件拖拽到窗口中，或者点击按钮选择。
2. **选择导出格式**：在下拉菜单中选择 HTML / PDF / PNG。
3. **配置选项**：勾选是否分离导出图片，或者是否把导出的内容打包成 ZIP。
4. **一键导出**：点击“开始导出”，下方的进度条会实时反馈处理状态。
#### 方式二：命令行操作 (CLI)
适合喜欢写自动化脚本或在终端操作的高级用户。
**基本语法**：
```bash
python obsidian_exporter.py <你的笔记.md> [选项]
```

**常用参数说明**：
*   `-o, --output <dir>`：指定导出文件存放的目录。
*   `--no-attachments`：仅导出纯文本（不处理任何附件）。
*   `--export-images`：将图片和附件分离出来，存放在导出同级目录下的同名文件夹中。
*   `--zip`：将导出的笔记及附件打包整合为一个 `.zip` 压缩包。
*   `--pdf`：将笔记导出为 PDF 格式。
*   `--png`：将笔记导出为 PNG 格式（适合手机长图分享）。

**命令行示例**：
把 `test.md` 导出到 `./export` 目录，连同提取出的附件一起打包成 ZIP 文件：
```bash
python obsidian_exporter.py test.md -o ./export --export-images --zip
```
# 要求
打开obsidian设置，按照图片要求，设置内部链接类型为：基于仓库根目录的绝对路径
![](record/obsidian/00-assets/obsidian导出PY脚本-20260427-174309.jpg)
# 代码

```

import os
import re
import base64
import shutil
import zipfile
import mimetypes
import argparse
import subprocess
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
import tkinter as tk
from tkinter import filedialog, messagebox
import tkinter.ttk as ttk

try:
    from tkinterdnd2 import TkinterDnD, DND_FILES
    HAS_DND = True
except ImportError:
    HAS_DND = False
    print("💡 提示: 若要支持拖拽文件，请安装 tkinterdnd2 库 (pip install tkinterdnd2)")

try:
    import markdown
except ImportError:
    print("需要安装 markdown 库。请运行: pip install markdown")
    exit(1)

# 支持的图片后缀
IMAGE_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp'}

def resolve_attachment_path(link_path_str, md_file):
    """根据用户的附件存放规则解析附件文件的系统真实路径"""
    link_path_str = link_path_str.split('|')[0].strip()
    filename = Path(link_path_str).name
    
    # 尝试推断仓库根目录 (通过寻找 .obsidian)
    vault_root = None
    curr = md_file.parent
    while curr != curr.parent:
        if (curr / ".obsidian").exists():
            vault_root = curr
            break
        curr = curr.parent

    # 策略1：如果链接是仓库的绝对路径
    if vault_root:
        clean_link = link_path_str.lstrip('\\/')
        potential_path = vault_root / clean_link
        if potential_path.exists():
            return potential_path

    # 策略2：基于用户描述的固定相对规则 —— 笔记所在目录/附件/笔记名/文件
    expected_path = md_file.parent / "附件" / md_file.stem / filename
    if expected_path.exists():
        return expected_path
        
    # 策略3：备用方案，全局遍历寻找
    # 如果有根目录就扫根目录，如果没有，至少扫当前笔记所在的父文件夹
    search_root = vault_root if vault_root else md_file.parent
    for root, _, files in os.walk(search_root):
        if filename in files:
            return Path(root) / filename

    return None

def extract_links(md_content):
    """提取 Markdown 中的所有引用的资源及原始匹配字符串"""
    # 匹配 Wiki 链接: [[xxx.pdf]] 或 ![[image.png]]
    wiki_pattern = re.compile(r'(!?)\[\[(.*?)\]\]')
    # 匹配 MD 链接: [text](xxx.pdf) 或 ![alt](image.png)
    md_pattern = re.compile(r'(!?)\[.*?\]\((.*?)\)')
    
    links = []
    
    for match in wiki_pattern.finditer(md_content):
        is_embed = match.group(1) == '!'
        filename = match.group(2).split('|')[0]
        if '.' in filename: 
            links.append({'match': match.group(0), 'file': filename, 'is_embed': is_embed})
            
    for match in md_pattern.finditer(md_content):
        is_embed = match.group(1) == '!'
        filename = match.group(2)
        if not filename.startswith('http') and '.' in filename:
            links.append({'match': match.group(0), 'file': filename, 'is_embed': is_embed})
            
    return links

# CSS样式表，模仿Obsidian的基础排版
CSS_STYLE = """
body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.6;
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    color: #333;
    background-color: #fff;
    font-size: 16px;
}
.page-title {
    font-size: 2.2em;
    font-weight: 700;
    border-bottom: none;
    margin-top: 0;
    margin-bottom: 0.5em;
}
h1, h2, h3, h4, h5, h6 {
    border-bottom: 1px solid #eaecef;
    padding-bottom: 0.3em;
    margin-top: 1.5em;
    margin-bottom: 16px;
    font-weight: 600;
}
img {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
    display: block;
    margin: 1.5rem auto;
}
pre {
    background-color: #f6f8fa;
    border-radius: 6px;
    padding: 16px;
    overflow: auto;
    line-height: 1.45;
}
code {
    background-color: rgba(27,31,35,0.05);
    border-radius: 3px;
    padding: 0.2em 0.4em;
    font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
    font-size: 85%;
}
pre code {
    background-color: transparent;
    padding: 0;
}
blockquote {
    margin: 0;
    padding: 0 1em;
    color: #6a737d;
    border-left: 0.25em solid #dfe2e5;
}
table {
    border-spacing: 0;
    border-collapse: collapse;
    width: 100%;
    margin-bottom: 16px;
}
th, td {
    border: 1px solid #dfe2e5;
    padding: 6px 13px;
}
tr:nth-child(2n) {
    background-color: #f6f8fa;
}
ul, ol {
    padding-left: 2em;
}
a {
    color: #0366d6;
    text-decoration: none;
}
a:hover {
    text-decoration: underline;
}
"""

def get_base64_image(filepath):
    """将图片文件转为 Base64 字符串"""
    mime_type, _ = mimetypes.guess_type(str(filepath))
    if not mime_type:
        mime_type = "image/png"
    with open(filepath, "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
    return f"data:{mime_type};base64,{encoded_string}"

def export_note(md_file_path, output_dir, export_format="HTML", export_attachments=True, export_images=False, zip_attachments=False):
    md_file = Path(md_file_path)
    out_dir = Path(output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    
    if not md_file.exists():
        print(f"❌ 找不到笔记文件: {md_file}")
        return False, "找不到笔记文件"
        
    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()

    links = extract_links(content)
    html_content = content
    resolved_resources = {}
    
    for link in links:
        match_str = link['match']
        filename = link['file']
        file_path = resolve_attachment_path(filename, md_file)
        
        if not file_path:
            html_content = html_content.replace(match_str, f'<span style="color:#d73a49; font-size:12px;">[找不到附件: {filename}]</span>')
            print(f"⚠️ 警告: 找不到资源文件 {filename}")
            continue
            
        ext = file_path.suffix.lower()
        is_image = ext in IMAGE_EXTENSIONS
        
        if is_image:
            try:
                b64 = get_base64_image(file_path)
                html_content = html_content.replace(match_str, f'<img src="{b64}" alt="{file_path.name}">')
            except Exception:
                html_content = html_content.replace(match_str, f'<span style="color:#d73a49; font-size:12px;">[图片加载失败: {filename}]</span>')
                
            if export_attachments and export_images:
                resolved_resources[match_str] = {
                    'path': file_path,
                    'filename': file_path.name,
                    'is_image': True
                }
        else:
            if export_attachments:
                resolved_resources[match_str] = {
                    'path': file_path,
                    'filename': file_path.name,
                    'is_image': False
                }
            else:
                html_content = html_content.replace(match_str, f'<span style="color:#6a737d; font-size:12px;">[未导出附件: {filename}]</span>')

    has_attachments = len(resolved_resources) > 0
    assets_folder_name = f"{md_file.stem}_附件"

    for match_str, res in resolved_resources.items():
        if not res['is_image']:
            if zip_attachments:
                new_link = f"附件/{res['filename']}"
            else:
                new_link = f"{assets_folder_name}/{res['filename']}"
            html_content = html_content.replace(match_str, f'<a href="{new_link}">{res["filename"]}</a>')

    # 启用更多插件
    final_html = markdown.markdown(html_content, extensions=['tables', 'fenced_code', 'nl2br', 'sane_lists', 'toc'])
    
    # 注入文档大标题 (模仿Obsidian的内联标题)
    body_content = f"<h1 class='page-title'>{md_file.stem}</h1>\n{final_html}"
    final_html = f"<html><head><meta charset='utf-8'><title>{md_file.stem}</title><style>{CSS_STYLE}</style></head><body>{body_content}</body></html>"

    main_doc_path = out_dir / f"{md_file.stem}.html"
    is_generate_failed = False
    
    if export_format in ["PDF", "PNG"]:
        temp_html = out_dir / f".temp_{md_file.stem}.html"
        with open(temp_html, 'w', encoding='utf-8') as f:
            f.write(final_html)
            
        browsers = [
            r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
        ]
        exe_path = next((b for b in browsers if os.path.exists(b)), None)
        
        if exe_path:
            try:
                creationflags = 0
                if os.name == 'nt':
                    creationflags = subprocess.CREATE_NO_WINDOW
                
                if export_format == "PDF":
                    pdf_path = out_dir / f"{md_file.stem}.pdf"
                    subprocess.run(
                        [exe_path, "--headless", "--disable-gpu", f"--print-to-pdf={pdf_path}", "--no-pdf-header-footer", str(temp_html)],
                        check=True, creationflags=creationflags
                    )
                    main_doc_path = pdf_path  # 主文档变成了PDF
                elif export_format == "PNG":
                    png_path = out_dir / f"{md_file.stem}.png"
                    subprocess.run(
                        [exe_path, "--headless", "--disable-gpu", f"--screenshot={png_path}", "--window-size=1080,20000", "--hide-scrollbars", str(temp_html)],
                        check=True, creationflags=creationflags
                    )
                    main_doc_path = png_path  # 主文档变成了PNG
                    
                    # 自动裁剪底部超长白边
                    try:
                        from PIL import Image, ImageChops
                        Image.MAX_IMAGE_PIXELS = None  # 防止报错
                        with Image.open(png_path) as img:
                            img_rgb = img.convert('RGB')
                            inv = ImageChops.invert(img_rgb)
                            bbox = inv.getbbox()
                            if bbox:
                                bottom = min(img.height, bbox[3] + 80)
                                if bottom < img.height:
                                    cropped = img.crop((0, 0, img.width, bottom))
                                    cropped.save(png_path)
                    except Exception as crop_err:
                        print(f"⚠️ 生成截图完成，但裁剪空白边缘失败: {crop_err}")
            except Exception as e:
                print(f"❌ 导出 {export_format} 失败: {e}")
                is_generate_failed = True
        else:
            print(f"❌ 找不到 Edge 或 Chrome，无法生成 {export_format}")
            is_generate_failed = True
            
        if temp_html.exists():
            os.remove(temp_html)
            
        if is_generate_failed:
            return False, f"导出 {export_format} 失败(未找到浏览器核心或渲染异常)"
    else:
        with open(main_doc_path, 'w', encoding='utf-8') as f:
            f.write(final_html)

    if zip_attachments and has_attachments:
        print(f"📦 模式：正在打包为 ZIP...")
        zip_path = out_dir / f"{md_file.stem}_export.zip"
        
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            # 写入主文档
            zipf.write(main_doc_path, arcname=main_doc_path.name)
            # 写入附件
            for res in resolved_resources.values():
                zipf.write(res['path'], arcname=f"附件/{res['filename']}")
        
        # 打包完成后，删除外面生成的主文档
        if main_doc_path.exists():
            os.remove(main_doc_path)
            
        print(f"✅ 成功导出 ZIP 包：{zip_path}")
        return True, f"成功导出 ZIP 包：{zip_path.name}"
    else:
        print(f"💡 模式：导出 {export_format} 文件...")
        if has_attachments:
            assets_dir = out_dir / assets_folder_name
            assets_dir.mkdir(parents=True, exist_ok=True)
            for res in resolved_resources.values():
                try:
                    shutil.copy2(res['path'], assets_dir / res['filename'])
                except Exception as e:
                    print(f"⚠️ 无法复制附件 {res['filename']}: {e}")
                    
        print(f"✅ 成功导出 {export_format}：{main_doc_path}")
        return True, f"成功导出 {export_format}：{main_doc_path.name}"

def run_gui():
    if HAS_DND:
        root = TkinterDnD.Tk()
    else:
        root = tk.Tk()
        
    root.title("Obsidian 智能导出工具")
    root.geometry("580x420")
    root.resizable(False, False)
    
    # Apple 风格/现代风格配置
    bg_color = "#f2f2f7"
    root.configure(bg=bg_color)
    
    style = ttk.Style()
    # 尝试使用 clam 主题（较清爽）
    if "clam" in style.theme_names():
        style.theme_use("clam")
        
    style.configure("TLabel", background=bg_color, font=("Microsoft YaHei", 9))
    style.configure("TButton", font=("Microsoft YaHei", 9), relief="flat")
    style.configure("TEntry", borderwidth=0)
    style.configure("TCombobox", font=("Microsoft YaHei", 9))
    style.configure("Title.TLabel", font=("Microsoft YaHei", 10, "bold"), foreground="#1d1d1f")

    default_output = os.path.join(os.path.expanduser("~"), "Desktop")
    
    output_var = tk.StringVar(value=default_output)
    export_format_var = tk.StringVar(value="HTML")
    export_attachments_var = tk.BooleanVar(value=False)
    export_images_var = tk.BooleanVar(value=False)
    zip_attachments_var = tk.BooleanVar(value=False)
    file_list = []

    def update_listbox():
        listbox.delete(0, tk.END)
        for f in file_list:
            listbox.insert(tk.END, Path(f).name)

    def add_files(paths):
        for p in paths:
            p = p.strip()
            if os.path.isdir(p):
                for root_dir, _, files in os.walk(p):
                    for file in files:
                        if file.endswith('.md'):
                            full_path = os.path.join(root_dir, file)
                            if full_path not in file_list:
                                file_list.append(full_path)
            elif p.endswith('.md') and p not in file_list:
                file_list.append(p)
        update_listbox()

    def select_note():
        paths = filedialog.askopenfilenames(filetypes=[("Markdown Files", "*.md")])
        if paths:
            add_files(paths)
            
    def select_folder():
        path = filedialog.askdirectory(title="选择包含笔记的文件夹")
        if path:
            add_files([path])

    def on_drop(event):
        if HAS_DND:
            paths = root.tk.splitlist(event.data)
            add_files(paths)

    def clear_list():
        file_list.clear()
        update_listbox()

    def select_output():
        path = filedialog.askdirectory(title="选择导出保存路径")
        if path:
            output_var.set(path)

    # 用来和后台线程通信
    progress_var = tk.DoubleVar()
    status_var = tk.StringVar(value="准备就绪")

    def run_export_thread(items, out_dir, fmt, ext_att, ext_img, zip_att):
        success_count = 0
        error_files = []
        total = len(items)

        def worker(file_path):
            try:
                res = export_note(
                    file_path, out_dir, fmt, ext_att, ext_img, zip_att
                )
                if res and res[0]:
                    return True, None
                else:
                    return False, Path(file_path).name
            except Exception as e:
                return False, f"{Path(file_path).name} (错误: {str(e)})"

        # 启动线程池加快并发速度
        completed = 0
        with ThreadPoolExecutor(max_workers=4) as executor:
            future_to_file = {executor.submit(worker, f): f for f in items}
            for future in as_completed(future_to_file):
                is_ok, err_msg = future.result()
                if is_ok:
                    success_count += 1
                else:
                    error_files.append(err_msg)
                
                completed += 1
                progress_var.set((completed / total) * 100)
                status_var.set(f"正在处理... ({completed}/{total})")
                
                # 安全地更新主UI界面
                root.update_idletasks()

        return success_count, error_files

    def start_export():
        if not file_list or not output_var.get():
            messagebox.showerror("错误", "请拉入要导出的笔记文件，并确认输出目录！")
            return
            
        # 提取各个变量的值
        items = list(file_list)
        out_dir = output_var.get()
        fmt = export_format_var.get()
        ext_att = export_attachments_var.get()
        ext_img = export_images_var.get()
        zip_att = zip_attachments_var.get()

        btn_export.config(state="disabled", text="正在多线程导出中...")
        progress_var.set(0)
        status_var.set("开始初始化并发任务...")
        progress_bar.grid(row=0, column=0, sticky="ew", padx=10, pady=(5, 0))
        status_label.grid(row=1, column=0, pady=(2, 5))
        root.update()

        # 开新线程防止界面卡死
        def task():
            success_count, error_files = run_export_thread(items, out_dir, fmt, ext_att, ext_img, zip_att)
            
            # 回到主界面线程执行结束动作
            root.after(0, lambda: finish_export(success_count, error_files))

        threading.Thread(target=task, daemon=True).start()

    def finish_export(success_count, error_files):
        btn_export.config(state="normal", text="🚀  开 始 导 出")
        status_var.set("就绪")
        progress_bar.grid_remove()
        status_label.grid_remove()
        
        if not error_files:
            messagebox.showinfo("导出成功", f"🎉 多线程处理完毕！成功导出 {success_count} 个笔记！")
        else:
            error_msg = "\n".join(error_files)
            messagebox.showwarning("部分完成", f"完毕，成功导出 {success_count} 个。\n以下文件失败：\n{error_msg}")

    # == UI 重新排版 ==
    margin_x = 25
    margin_y = 20

    title_text = "拖拽笔记 / 文件夹到下方列表中 :" if HAS_DND else "待导出的 Markdown 笔记明细:"
    ttk.Label(root, text=title_text, style="Title.TLabel").place(x=margin_x, y=margin_y)
    
    # 列表框
    list_frame = tk.Frame(root, bg="white", highlightthickness=1, highlightbackground="#d1d1d6")
    list_frame.place(x=margin_x, y=margin_y+30, width=420, height=130)
    scrollbar = ttk.Scrollbar(list_frame)
    scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
    listbox = tk.Listbox(list_frame, yscrollcommand=scrollbar.set, selectmode=tk.EXTENDED, 
                         bd=0, highlightthickness=0, font=("Microsoft YaHei", 9), fg="#333333")
    listbox.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=5, pady=5)
    scrollbar.config(command=listbox.yview)
    
    # 右侧按钮组
    btn_y_start = margin_y + 30
    ttk.Button(root, text="➕ 添 加", command=select_note, width=10).place(x=460, y=btn_y_start)
    ttk.Button(root, text="📁 文件夾", command=select_folder, width=10).place(x=460, y=btn_y_start + 40)
    ttk.Button(root, text="🗑 清 空", command=clear_list, width=10).place(x=460, y=btn_y_start + 80)

    # 导出目录
    ttk.Label(root, text="存放位置 :", style="Title.TLabel").place(x=margin_x, y=205)
    entry_frame = tk.Frame(root, bg="white", highlightthickness=1, highlightbackground="#d1d1d6")
    entry_frame.place(x=margin_x, y=235, width=420, height=30)
    tk.Entry(entry_frame, textvariable=output_var, bd=0, highlightthickness=0, font=("Microsoft YaHei", 9), bg="white").pack(fill=tk.BOTH, expand=True, padx=8, pady=4)
    ttk.Button(root, text="更改目录", command=select_output, width=10).place(x=460, y=235)

    def toggle_attachment_options():
        state = tk.NORMAL if export_attachments_var.get() else tk.DISABLED
        cb_img.config(state=state)
        cb_zip.config(state=state)

    # 选项区
    ttk.Label(root, text="导出设定 :", style="Title.TLabel").place(x=margin_x, y=285)
    format_cb = ttk.Combobox(root, textvariable=export_format_var, values=["HTML", "PDF", "PNG"], state="readonly", width=8)
    format_cb.place(x=100, y=285)

    cb_att = tk.Checkbutton(root, text="提取附件", variable=export_attachments_var, command=toggle_attachment_options, bg=bg_color, activebackground=bg_color, font=("Microsoft YaHei", 9))
    cb_att.place(x=200, y=285)
    cb_img = tk.Checkbutton(root, text="分离图片", variable=export_images_var, bg=bg_color, activebackground=bg_color, font=("Microsoft YaHei", 9))
    cb_img.place(x=280, y=285)
    cb_zip = tk.Checkbutton(root, text="附件打ZIP", variable=zip_attachments_var, bg=bg_color, activebackground=bg_color, font=("Microsoft YaHei", 9))
    cb_zip.place(x=360, y=285)

    toggle_attachment_options()

    # 优雅的主运行按钮
    # Mac 的大按钮通常是蓝色或绿色，略带圆角，tk 画圆角按钮较麻烦，这里使用 canvas 绘制或美化按钮即可
    btn_export = tk.Button(root, text="🚀  开 始 导 出", bg="#007aff", fg="white", 
                           font=("Microsoft YaHei", 12, "bold"), bd=0, relief="flat",
                           activebackground="#005ecb", activeforeground="white", cursor="hand2", command=start_export)
    btn_export.place(x=40, y=325, width=500, height=45)
    
    # === 构建下方的进度条框架 ===
    progress_frame = tk.Frame(root, bg=bg_color)
    progress_frame.place(x=40, y=375, width=500, height=40)
    progress_frame.columnconfigure(0, weight=1)
    
    progress_bar = ttk.Progressbar(progress_frame, variable=progress_var, mode="determinate", length=480)
    status_label = tk.Label(progress_frame, textvariable=status_var, bg=bg_color, fg="#666666", font=("Microsoft YaHei", 8))

    if HAS_DND:
        listbox.drop_target_register(DND_FILES)
        listbox.dnd_bind('<<Drop>>', on_drop)
        root.drop_target_register(DND_FILES)
        root.dnd_bind('<<Drop>>', on_drop)

    root.mainloop()

if __name__ == "__main__":
    import sys
    # 如果带有参数，则继续支持命令行调用；否则启动 GUI
    if len(sys.argv) > 1:
        parser = argparse.ArgumentParser(description="Obsidian 智能导出工具")
        parser.add_argument("note", help="要导出的 Markdown 笔记路径")
        parser.add_argument("-o", "--output", default=".", help="导出目录 (默认为当前目录)")
        parser.add_argument("--no-attachments", action="store_true", help="是否不导出附件")
        parser.add_argument("--export-images", action="store_true", help="是否连同图片一并导出")
        parser.add_argument("--zip", action="store_true", help="将附件打包为 ZIP")
        parser.add_argument("--pdf", action="store_true", help="另外导出为 PDF")
        parser.add_argument("--png", action="store_true", help="另外导出为 PNG 长截图")
        
        args = parser.parse_args()
        if args.pdf:
            fmt = "PDF"
        elif args.png:
            fmt = "PNG"
        else:
            fmt = "HTML"
        export_note(args.note, args.output, fmt, not args.no_attachments, args.export_images, args.zip)
    else:
        run_gui()
```