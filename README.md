# Wuwatappo_Helper

**仅供娱乐使用，创作者概不负责。**

WuwaTappo 1.0.1 的非官方 Windows 辅助修改版本。原程序、角色、配件、表情及界面素材的权利归各自权利人所有。

[下载安装包](https://github.com/Fantasicrap/Wuwatappo_Helper/releases/latest/download/Wuwatappo_Helper-1.0.0-Setup.exe) · [下载免安装版](https://github.com/Fantasicrap/Wuwatappo_Helper/releases/latest/download/Wuwatappo_Helper-1.0.0-Portable.zip) · [全部发布文件](https://github.com/Fantasicrap/Wuwatappo_Helper/releases) · [使用说明](docs/使用说明.md)

## 库存分享

- 一键读取当前账号已拥有的完整库存，按角色、配件、表情分区，每行 5 个。
- 使用原程序的背景纹理、四种稀有度底图和库存图片：Epic 彩色、Rare 紫色、Uncommon 蓝色、Common 绿色。
- 各分类内按稀有度从高到低、系列名称、角色名排序；名称按中文拼音自然顺序排列，同名按素材 ID 保持稳定顺序。
- 显示拥有数量、角色名和系列名；支持预览、保存 PNG、复制图片和取消生成。
- 不受当前筛选条件或滚动位置影响；素材加载失败会明确标记；特别大的库存会分段导出。

## 其他功能

- 设置面板请求取消置顶、显示在任务栏，点击外部保留面板，保留关闭按钮。
- 保留自动宝箱开关：默认关闭，倒计时结束至少等 2 秒，检查领取条件，失败后退避重试。
- 联机页一键显示、隐藏其他成员的桌宠，仅影响本机显示。
- 自定义刷新、游戏模式、屏幕切换和桌宠显隐快捷键，提供冲突提醒，保留 PrtScr 截图键。
- 保留此前的本地点击数按钮；本地显示变化不代表服务器已接受或已发放奖励。

## 安装与使用

1. 退出正在运行的 WuwaTappo 或旧版修改程序。
2. 下载并运行 `Wuwatappo_Helper-1.0.0-Setup.exe`，选择安装目录；桌面快捷方式可选。也可解压免安装版后运行 `Wuwatappo_Helper.exe`。
3. 登录并打开库存，等库存加载结束后点击“分享库存长图”。
4. 生成完成后点击“保存 PNG”或“复制图片”。

安装包默认安装到当前用户目录，无需管理员权限。请保留 Windows WebView2 Runtime。升级前退出程序；卸载入口在 Windows“已安装的应用”中。卸载不清理原程序的账号和偏好数据。

## 验证与限制

已完成隔离逻辑测试、排序及五列分页测试、使用原版底图的离线 PNG 排版检查、JavaScript 语法检查和 EXE 资源独立解压核验。安装包会进行独立目录安装和文件摘要检查。

当前环境的原生窗口自动化未能初始化，因此窗口遮盖、WebView 中保存与复制、真实账号宝箱领取尚未经自动化实机验证。离线测试图片是示例素材，不是用户账号库存。程序更新后需要重新适配，不能将本补丁直接用于其他原件。

本版本只适配以下原始文件：

```text
WuwaTappo.exe 1.0.1 / 77,958,880 bytes
SHA-256: dd340c92a7320d1ecf3697ba65b4ad23d8f196acb547d2baf3f75ba09d696d97
```

## 从本地原件构建

仓库包含辅助补丁与打包脚本，不提交原程序的解包代码、图片、账号文件或本机配置。

需要 Windows、Node.js 22 或更新版本、pnpm、PowerShell 7、Inno Setup 6（或兼容版本）。

```powershell
pnpm install --frozen-lockfile
pwsh -File scripts/build.ps1 -SourceExe 'F:\WuwaTappo\WuwaTappo.exe' -IsccPath 'C:\Program Files (x86)\Inno Setup 6\ISCC.exe'
```

脚本会核验原件摘要，提取构建所需资源并生成离线测试样例，运行检查，输出 EXE、安装包、免安装 ZIP 和 SHA-256 校验文件到 `dist/`。不会改动输入原件，也不会请求账号业务接口。

详见 [免责声明](DISCLAIMER.txt) 与 [第三方说明](THIRD_PARTY_NOTICES.md)。
