import requests
import time
import os
import json

# 配置
API_BASE_URL = "http://localhost:8002"
TEST_FILE = "public/Badminton.mp3"
OUTPUT_DIR = "tests/output"

def test_backend_connection():
    print(f"🚀 开始测试后端 API 接入...")
    
    if not os.path.exists(TEST_FILE):
        print(f"❌ 错误: 找不到测试文件 {TEST_FILE}")
        return

    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    # 1. 上传文件
    print(f"📤 正在上传 {TEST_FILE} 到 {API_BASE_URL}/api/upload...")
    try:
        with open(TEST_FILE, "rb") as f:
            files = {"file": f}
            data = {"include_audio": "false"}
            response = requests.post(f"{API_BASE_URL}/api/upload", files=files, data=data)
        
        if response.status_code != 200:
            print(f"❌ 上传失败: HTTP {response.status_code} - {response.text}")
            return
        
        task_id = response.json().get("task_id")
        print(f"✅ 上传成功! Task ID: {task_id}")
    except Exception as e:
        print(f"❌ 连接后端失败: {e}")
        print("💡 请确保后端服务已启动 (uvicorn app.main:app --port 8002)")
        return

    # 2. 轮询状态
    print(f"⏳ 开始轮询任务状态...")
    start_time = time.time()
    while True:
        try:
            status_resp = requests.get(f"{API_BASE_URL}/api/task/{task_id}")
            status_data = status_resp.json()
            status = status_data.get("status")
            progress = status_data.get("progress", "无进度信息")
            
            print(f"  > 状态: {status} | 进度: {progress}")
            
            if status == "completed":
                print(f"🎉 任务处理完成!")
                files_to_download = status_data.get("files", [])
                break
            elif status == "failed":
                print(f"❌ 任务失败: {status_data.get('error')}")
                return
            
            # 超时保护 (10分钟)
            if time.time() - start_time > 600:
                print(f"❌ 测试超时 (10分钟)")
                return
                
            time.sleep(5)
        except Exception as e:
            print(f"❌ 轮询出错: {e}")
            return

    # 3. 下载并验证数据
    print(f"📥 正在下载分析结果...")
    for file_url in files_to_download:
        filename = file_url.split("/")[-1]
        save_path = os.path.join(OUTPUT_DIR, filename)
        
        try:
            dl_resp = requests.get(f"{API_BASE_URL}{file_url}")
            with open(save_path, "wb") as f:
                f.write(dl_resp.content)
            print(f"✅ 已保存: {save_path}")
            
            if filename == "analysis.json":
                # 简单验证 JSON 结构
                with open(save_path, "r") as f:
                    content = json.load(f)
                    if "tracks" in content:
                        print(f"✨ 数据格式校验通过: 发现轨道 {list(content['tracks'].keys())}")
                    else:
                        print(f"⚠️ 警告: analysis.json 结构不符合预期")
        except Exception as e:
            print(f"❌ 下载 {filename} 失败: {e}")

    print(f"\n✅ 测试流程全部结束。")

if __name__ == "__main__":
    test_backend_connection()
