#!/usr/bin/env bun
/**
 * 简单的命令行工具示例
 * 演示如何构建为可执行文件
 */

import { logger, env, proc, runtime } from '../backend/utils/runtime-compat.js'

// 显示帮助信息
function showHelp() {
    console.log(`
MagicBook CLI Tool v1.0.0

用法:
  simple-cli [命令] [选项]

命令:
  info        显示系统信息
  config      显示配置信息
  test        运行测试
  help        显示此帮助信息

选项:
  --verbose   详细输出
  --quiet     静默模式
  --version   显示版本号

示例:
  simple-cli info --verbose
  simple-cli config
  simple-cli test --quiet

构建为可执行文件:
  bun build --compile examples/simple-cli.ts --outfile simple-cli
`)
}

// 显示系统信息
function showSystemInfo(verbose = false) {
    logger.info('=== 系统信息 ===')
    logger.info(`运行时: ${runtime.name} ${runtime.version}`)
    logger.info(`平台: ${proc.cwd()}`)
    logger.info(`进程ID: ${proc.pid}`)
    
    if (verbose) {
        logger.info(`命令行参数: ${proc.argv().join(' ')}`)
        
        const memory = require('process').memoryUsage?.() || {}
        if (memory.rss) {
            logger.info(`内存使用: ${(memory.rss / 1024 / 1024).toFixed(2)}MB`)
        }
        
        const envVars = env.getAll()
        const envCount = Object.keys(envVars).length
        logger.info(`环境变量数量: ${envCount}`)
    }
}

// 显示配置信息
function showConfig() {
    logger.info('=== 配置信息 ===')
    
    const config = {
        nodeEnv: env.get('NODE_ENV', 'development'),
        port: env.get('PORT', '3000'),
        debug: env.get('DEBUG', 'false'),
        home: env.get('HOME') || env.get('USERPROFILE'),
        path: env.get('PATH')?.split(':').length || 0
    }
    
    for (const [key, value] of Object.entries(config)) {
        if (key === 'path') {
            logger.info(`${key}: ${value} 个路径`)
        } else {
            logger.info(`${key}: ${value}`)
        }
    }
}

// 运行测试
async function runTest(quiet = false) {
    if (!quiet) {
        logger.info('=== 运行测试 ===')
    }
    
    const tests = [
        {
            name: '运行时检测',
            test: () => runtime.name === 'bun' || runtime.name === 'node'
        },
        {
            name: '环境变量读取',
            test: () => typeof env.get('PATH') === 'string'
        },
        {
            name: '进程信息获取',
            test: () => typeof proc.pid === 'number'
        }
    ]
    
    let passed = 0
    let failed = 0
    
    for (const { name, test } of tests) {
        try {
            const result = test()
            if (result) {
                if (!quiet) logger.info(`✅ ${name}`)
                passed++
            } else {
                if (!quiet) logger.error(`❌ ${name}`)
                failed++
            }
        } catch (error) {
            if (!quiet) logger.error(`❌ ${name}: ${error}`)
            failed++
        }
    }
    
    const total = passed + failed
    logger.info(`测试结果: ${passed}/${total} 通过`)
    
    if (failed > 0) {
        proc.exit(1)
    }
}

// 主函数
async function main() {
    const args = proc.argv()
    const command = args[2] || 'help'
    
    const verbose = args.includes('--verbose')
    const quiet = args.includes('--quiet')
    const showVersion = args.includes('--version')
    
    // 设置日志级别
    if (quiet) {
        // 在quiet模式下减少输出
    }
    
    if (showVersion) {
        console.log('1.0.0')
        return
    }
    
    switch (command) {
        case 'info':
            showSystemInfo(verbose)
            break
            
        case 'config':
            showConfig()
            break
            
        case 'test':
            await runTest(quiet)
            break
            
        case 'help':
        case '--help':
        case '-h':
            showHelp()
            break
            
        default:
            logger.error(`未知命令: ${command}`)
            logger.info('使用 --help 查看可用命令')
            proc.exit(1)
    }
}

// 如果直接运行此脚本
if (import.meta.main) {
    main().catch(error => {
        logger.error('执行失败:', error)
        proc.exit(1)
    })
}

export { showHelp, showSystemInfo, showConfig, runTest }
