# Spine 2D Live Loader for LayaAir

## Changelog
* 2017.May.25: Verified there is no need to change anything with the newest LayaAir IDE 1.7.5 beta update.
* 2017.Apr.28: Updated for using files come from LayaAir IDE 1.7.4 beta.
* 2017.Apr.27: Initial version based on LayaAir IDE 1.7.3 beta.

## Introduction
This project is mean to provide a spine 2d live loader in runtime for LayaAir,which is an alternative solution compare to  the original one provided by LayaAir that convert spine ".json" and ".atlas" to ".sk" file statically in development time.

The code is based on the code of static spine converter which is embedded in LayaAir IDE.The original filename is "laya.LayaAnimationTool.js",which is stored in the directory "resources/app/out/vs/layaEditor/h5/js" of LayaAir IDE.

Please note that to exchange the storage space and additional cost in development workflow,this live loader sacrifise the performance in load-time.You can't have your cake and eat it.

## Usage
1. Copy laya.LayaAnimationTool.js to your runtime directory and add it to the container html file.
2. Copy LayaAnimationTool.d.ts to project dir.
3. Instantiate Laya.SpineAnimationTemplet and call loadSpineAni to load spine exported resource.
4. Check the example project for more detail.
