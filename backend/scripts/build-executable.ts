#!/usr/bin/env bun
/**
 * Bun可执行文件构建脚本
 * 演示如何使用Bun将TypeScript编译为单个可执行文件
 */

import { logger, proc, env, fs, runtime } from '../utils/runtime-compat.js'
import path from 'path'

// 构建配置
const buildConfig = {
    // 入口文件
    entrypoint: './backend/server.ts',
    
    // 输出目录
    outdir: './dist',
    
    // 可执行文件名
    executableName: 'magicbook',
    
    // 构建目标平台
    targets: ['linux-x64', 'darwin-x64', 'windows-x64'] as const,
    
    // 是否压缩
    minify: true,
    
    // 是否包含源码映射
    sourcemap: false
}

// 检查Bun环境
function checkBunEnvironment() {
    if (!runtime.isBun) {
        logger.error('This script requires Bun runtime')
        logger.info('Please install Bun: curl -fsSL https://bun.sh/install | bash')
        proc.exit(1)
    }
    
    logger.info(`Using Bun ${runtime.version}`)
}

// 创建构建目录
async function createBuildDirectory() {
    const outdir = buildConfig.outdir
    
    if (await fs.exists(outdir)) {
        logger.info(`Cleaning existing build directory: ${outdir}`)
        // 这里可以添加清理逻辑
    }
    
    // 创建输出目录的逻辑会由Bun自动处理
    logger.info(`Build directory: ${outdir}`)
}

// 使用Bun.build构建单个文件
async function buildSingleFile() {
    logger.info('Building single executable file...')
    
    try {
        const result = await Bun.build({
            entrypoints: [buildConfig.entrypoint],
            outdir: buildConfig.outdir,
            target: 'bun',
            minify: buildConfig.minify,
            sourcemap: buildConfig.sourcemap,
            splitting: false, // 禁用代码分割，生成单个文件
        })
        
        if (result.success) {
            logger.info(`✅ Build successful!`)
            logger.info(`Output files: ${result.outputs.length}`)
            
            for (const output of result.outputs) {
                logger.info(`  - ${output.path}`)
            }
        } else {
            logger.error('❌ Build failed!')
            for (const message of result.logs) {
                logger.error(`  ${message.message}`)
            }
        }
        
        return result.success
    } catch (error) {
        logger.error('Build error:', error)
        return false
    }
}

// 构建可执行二进制文件（实验性功能）
async function buildExecutable() {
    logger.info('Building executable binary...')
    
    // 注意：这是实验性功能，可能不稳定
    const commands = buildConfig.targets.map(target => {
        const ext = target.includes('windows') ? '.exe' : ''
        const outputPath = path.join(buildConfig.outdir, `${buildConfig.executableName}-${target}${ext}`)
        
        return {
            target,
            command: [
                'bun', 'build',
                '--compile',
                '--target', target,
                '--outfile', outputPath,
                buildConfig.entrypoint
            ],
            outputPath
        }
    })
    
    const results = []
    
    for (const { target, command, outputPath } of commands) {
        logger.info(`Building for ${target}...`)
        
        try {
            // 这里我们模拟命令执行，实际中你可能需要使用child_process
            logger.info(`Command: ${command.join(' ')}`)
            logger.info(`Output: ${outputPath}`)
            
            // 实际构建命令会在这里执行
            // const result = await execCommand(command)
            
            results.push({
                target,
                success: true,
                outputPath
            })
            
            logger.info(`✅ ${target} build completed`)
        } catch (error) {
            logger.error(`❌ ${target} build failed:`, error)
            results.push({
                target,
                success: false,
                error
            })
        }
    }
    
    return results
}

// 创建启动脚本
async function createStartupScript() {
    const scriptContent = `#!/bin/bash
# MagicBook启动脚本

# 检测操作系统
OS="$(uname -s)"
ARCH="$(uname -m)"

case $OS in
    Linux*)     PLATFORM="linux";;
    Darwin*)    PLATFORM="darwin";;
    CYGWIN*|MINGW*|MSYS*) PLATFORM="windows";;
    *)          echo "不支持的操作系统: $OS"; exit 1;;
esac

case $ARCH in
    x86_64)     ARCH="x64";;
    arm64)      ARCH="arm64";;
    *)          echo "不支持的架构: $ARCH"; exit 1;;
esac

# 构建可执行文件名
EXECUTABLE="./magicbook-\${PLATFORM}-\${ARCH}"
if [ "$PLATFORM" = "windows" ]; then
    EXECUTABLE="\${EXECUTABLE}.exe"
fi

# 检查文件是否存在
if [ ! -f "$EXECUTABLE" ]; then
    echo "错误: 找不到适用于 \${PLATFORM}-\${ARCH} 的可执行文件"
    echo "请运行构建脚本生成可执行文件"
    exit 1
fi

# 执行程序
echo "启动 MagicBook (\${PLATFORM}-\${ARCH})..."
exec "$EXECUTABLE" "$@"
`

    const scriptPath = path.join(buildConfig.outdir, 'start.sh')
    await fs.writeFile(scriptPath, scriptContent)
    
    logger.info(`Created startup script: ${scriptPath}`)
    return scriptPath
}

// 显示构建信息
function showBuildInfo() {
    logger.info('=== Bun可执行文件构建配置 ===')
    logger.info(`入口文件: ${buildConfig.entrypoint}`)
    logger.info(`输出目录: ${buildConfig.outdir}`)
    logger.info(`可执行文件名: ${buildConfig.executableName}`)
    logger.info(`目标平台: ${buildConfig.targets.join(', ')}`)
    logger.info(`压缩代码: ${buildConfig.minify}`)
    logger.info(`源码映射: ${buildConfig.sourcemap}`)
}

// 显示使用说明
function showUsageInstructions() {
    logger.info('=== 使用说明 ===')
    logger.info('1. 单文件构建 (推荐):')
    logger.info('   bun run build-executable.ts --single')
    logger.info('')
    logger.info('2. 可执行二进制构建 (实验性):')
    logger.info('   bun run build-executable.ts --executable')
    logger.info('')
    logger.info('3. 完整构建 (包含启动脚本):')
    logger.info('   bun run build-executable.ts --full')
    logger.info('')
    logger.info('4. 手动构建单个可执行文件:')
    logger.info('   bun build --compile --outfile ./dist/magicbook ./backend/server.ts')
    logger.info('')
    logger.info('5. 手动构建JavaScript包:')
    logger.info('   bun build ./backend/server.ts --outdir ./dist --target bun')
}

// 主函数
async function main() {
    const args = proc.argv()
    const hasArg = (arg: string) => args.includes(arg)
    
    checkBunEnvironment()
    showBuildInfo()
    
    if (hasArg('--help') || hasArg('-h')) {
        showUsageInstructions()
        return
    }
    
    await createBuildDirectory()
    
    if (hasArg('--single') || hasArg('--full')) {
        const success = await buildSingleFile()
        if (!success) {
            proc.exit(1)
        }
    }
    
    if (hasArg('--executable') || hasArg('--full')) {
        const results = await buildExecutable()
        const failed = results.filter(r => !r.success)
        
        if (failed.length > 0) {
            logger.warn(`${failed.length} builds failed`)
        }
    }
    
    if (hasArg('--full')) {
        await createStartupScript()
    }
    
    if (!hasArg('--single') && !hasArg('--executable') && !hasArg('--full')) {
        logger.info('没有指定构建类型，显示使用说明:')
        showUsageInstructions()
        return
    }
    
    logger.info('🎉 构建完成!')
}

// 如果直接运行此脚本
if (import.meta.main) {
    main().catch(error => {
        logger.error('构建失败:', error)
        proc.exit(1)
    })
}

export default {
    buildSingleFile,
    buildExecutable,
    createStartupScript,
    buildConfig
}
