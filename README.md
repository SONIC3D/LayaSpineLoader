# Spine 2D Live Loader for LayaAir

## Introduction
This project is mean to provide a spine 2d live loader in runtime for LayaAir,which is an alternative solution compare to  the original one provided by LayaAir that convert spine ".json" and ".atlas" to ".sk" file statically in development time.

The code is based on the code of static spine converter which is embedded in LayaAir IDE.The original filename is "laya.LayaAnimationTool.js",which is stored in the directory "resources/app/out/vs/layaEditor/h5/js" of LayaAir IDE.

Please note that to exchange the storage space and additional cost in development workflow,this live loader sacrifise the performance in load-time.You can't have your cake and eat it.
