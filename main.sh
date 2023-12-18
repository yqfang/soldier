#!/bin/bash

# 检查是否提供了引擎和脚本名
if [ $# -lt 2 ]; then
  echo "Usage: $0 <engine> <script_name> [script_args...]"
  exit 1
fi

# 获取引擎和脚本名
engine="$1"
script_name="$2"
shift 2  # 移除前两个参数

# 如果提供了多余的参数，将其传递给内部脚本
if [ $# -gt 0 ]; then
  script_args=("$@")
else
  script_args=()
fi

# 设置最大重试次数、初始等待时间、最大运行时间和强制终止时间
initial_delay=2
max_run_time=30
force_terminate_time=180  # 设置强制终止时间为3分钟



# 初始化指数退避的冲刺次数
backoff_attempts=0

# 定义终止子进程的函数
terminate_child() {
  echo "Terminating child process..."
  if [ -n "$script_pid" ]; then
    kill -TERM "$script_pid"
  fi
  exit
}

# 捕获退出信号，调用终止子进程的函数
trap 'terminate_child' EXIT

# 循环执行脚本，直到成功或达到最大重试次数
while true; do
  # 检查脚本是否存在
  if [ ! -f "$script_name" ]; then
    echo "Error: Script '$script_name' not found."
    exit 1
  fi
# 记录脚本开始运行的时间
start_time=$(date +%s)
  # 执行脚本并将输出重定向到标准输出
  "$engine" "$script_name" "${script_args[@]}" &

  # 获取后台进程的PID
  script_pid=$!

  # 获取退出状态码
  wait $script_pid
  exit_code=$?

  # 获取脚本运行的实际时间
  current_time=$(date +%s)
  elapsed_time=$((current_time - start_time))

  # 获取当前时间的格式化字符串
  current_time_formatted=$(date "+%Y-%m-%d %H:%M:%S")


  # 如果退出状态码为0，表示脚本成功执行
  if [ $exit_code -eq 0 ]; then
    # 清零指数退避的冲刺次数
    backoff_attempts=0
  else
    # 如果脚本运行时间超过30秒，清零指数退避的冲刺次数
    if [ $elapsed_time -ge $max_run_time ]; then
      echo "Script execution time exceeded 30 seconds (${runtime_seconds} seconds). Resetting backoff attempts."
      backoff_attempts=0
    else
      # 计算等待时间，采用指数退避算法
      delay=$((initial_delay * (2 ** backoff_attempts)))

      # 输出错误信息和等待时间
      echo "Error: Script failed (Exit Code: $exit_code) at $current_time_formatted. " \
           "Runtime: ${elapsed_time} seconds. Retrying in $delay seconds..."

      # 增加指数退避的冲刺次数
      ((backoff_attempts++))

      # 强制终止脚本
      if [ -n "$script_pid" ]; then
        echo "Forcing termination of script (PID: $script_pid)..."
        kill -TERM "$script_pid"
      fi

      # 等待一定时间再重试
      sleep $delay
    fi
  fi
done
