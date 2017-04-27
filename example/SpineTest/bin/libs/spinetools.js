/**
 * Created by LZJ on 2017/4/26.
 */

(function (window, document, Laya) {
    var __un = Laya.un, __uns = Laya.uns, __static = Laya.static, __class = Laya.class, __getset = Laya.getset,
        __newvec = Laya.__newvec;

    var AnimationTemplet = laya.ani.AnimationTemplet, Browser = laya.utils.Browser, Byte = laya.utils.Byte,
        Event = laya.events.Event;
    var EventDispatcher = laya.events.EventDispatcher, Handler = laya.utils.Handler, Loader = laya.net.Loader,
        Matrix = laya.maths.Matrix;
    var Point = laya.maths.Point, Sprite = laya.display.Sprite, Templet = laya.ani.bone.Templet,
        Texture = laya.resource.Texture;
    var WebGL = laya.webgl.WebGL;

    //class dragonBones.DragonBoneTools
    var DragonBoneTools = (function () {
        function DragonBoneTools() {
            this.nodePath = null;
            this.fs = null;
            this.mTools = null;
            this.mFileList = [];
            this.mCompleteFun = null;
            this.mFailFun = null;
            this.mType = 0;
            this.mOutPath = null;
            this._completeNum = 0;
            this._totalNum = 0;
            // this.nodePath=require("path");
            // this.fs=require("fs");
        }

        __class(DragonBoneTools, 'dragonBones.DragonBoneTools');
        var __proto = DragonBoneTools.prototype;
        __proto.loadFile = function (path, outPath, completeFun, failFun, type) {
            (type === void 0) && (type = 0);
            if (this.mTools == null) {
                this.mTools = new BoneAniTools();
            }
            this._completeNum = 0;
            this.mType = type;
            this.mFileList.length = 0;
            this.mOutPath = outPath;
            this.mFailFun = failFun;
            this.mCompleteFun = completeFun;
            this.walk(path, 0, this.handleFile, this.mFileList); // ["C:\path\spine", 0, "spineboy"]
            this._totalNum = this.mFileList.length;
            this.next();
        }

        __proto.next = function () {
            if (this.mFileList.length > 0) {
                this._completeNum++;
                var tPath = this.mFileList.shift();
                if ((tPath instanceof Array)) {
                    var tArr = tPath;
                    if (tArr.length == 3) {
                        this.mTools.loadFile(this.nodePath, this, tPath[0], this.mOutPath, this.completeHandler, this.failHandler, this.mType, tPath[1], tArr[2]);
                    } else {
                        this.mTools.loadFile(this.nodePath, this, tPath[0], this.mOutPath, this.completeHandler, this.failHandler, this.mType, tPath[1]);
                    }
                } else {
                    this.mTools.loadFile(this.nodePath, this, tPath, this.mOutPath, this.completeHandler, this.failHandler, this.mType);
                }
            } else {
                var tInfo = "";
                if (this._totalNum > 0) {
                    var tStr = "符合条件的有" + this._totalNum + "个，已有" + this._completeNum + "个成功转换";
                    tInfo += tStr;
                } else {
                    tInfo += "没找到可以被转换的文件,请确认文件夹名跟文件名是否一致";
                }
                this.mCompleteFun.call(null, tInfo);
            }
        }

        //mCompleteFun.call();
        __proto.failHandler = function (errorInfo) {
            this.mFailFun.call(null, errorInfo);
        }

        __proto.completeHandler = function (sucess, data, picInput, picOutput) {
            var buffer = new Buffer(data.byteLength);
            var view = new Uint8Array(data);
            for (var i = 0; i < buffer.length; ++i) {
                buffer[i] = view[i];
            }
            this.mkdirsSyncLaya(this.nodePath.dirname(sucess));
            this.fs.writeFileSync(sucess, buffer);
            if (picInput) {
                for (i = 0; i < picInput.length; i++) {
                    this.mkdirsSyncLaya(this.nodePath.dirname(picOutput[i]));
                    this.fs.writeFileSync(picOutput[i], this.fs.readFileSync(picInput[i]));
                }
            }
            this.mTools.clear();
            this.next();
        }

        __proto.mkdirsSyncLaya = function (dirname, mode) {
            if (this.fs.existsSync(dirname)) {
                return true;
            } else {
                if (this.mkdirsSyncLaya(this.nodePath.dirname(dirname), mode)) {
                    this.fs.mkdirSync(dirname, mode);
                    return true;
                }
            }
            return false;
        }

        /*
         递归处理文件,文件夹 获取一个经过验证，确认为导出文件的数组，对于spine内容，最终结果数组out中每个元素都是[目录路径,0,文件名]，不带atlas/png/json后缀
         path 路径
         floor 层数
         handleFile 文件,文件夹处理函数
         */
        __proto.walk = function (path, floor, handleFile, out) {
            var _$this = this;
            var tArray = [];
            handleFile(path, floor);
            floor++;
            var files = this.fs.readdirSync(path);
            files.forEach(function (item) {
                var tmpPath = _$this.nodePath.join(path, item);
                var stats = _$this.fs.statSync(tmpPath);
                if (stats.isDirectory()) {
                    _$this.walk(tmpPath, floor, handleFile, out);
                } else {
                    tArray.push(tmpPath);
                    handleFile(tmpPath, floor);
                }
            });
            var tFileName = this.nodePath.basename(path).split(".")[0];
            var cType = 0;
            var haha;
            haha = out;
            this.getOkFileList(this.mType, tArray, haha);
        }

        // 获取一个经过验证，确认为导出文件的数组，对于spine内容，调用时的参数为[1，带全路径的文件名列表，结果数组]，最终结果数组中每个元素都是[目录路径,0,文件名] ，不带atlas/png/json后缀
        __proto.getOkFileList = function (type, fileArray, rst) {
            var i = 0, len = 0;
            len = fileArray.length;
            for (i = 0; i < len; i++) {
                var tRst;
                tRst = this.checkIsExportFile(type, fileArray[i], fileArray);
                if (tRst) {
                    rst.push(tRst);
                }
            }
            return rst;
        }

        // 对spine文件，输入参数为(1,带路径的完整文件名，全部文件列表)，如果参数2是一个.atlas，并且可以找到对应的json和png，就返回[目录路径,0,文件名] ，不带atlas/png/json后缀
        __proto.checkIsExportFile = function (type, tFileName, fileArray) {
            var name;
            name = this.getFileName(tFileName);
            if (name == "texture")return null;
            var tDir;
            tDir = this.getDir(tFileName);
            switch (type) {
                case 0:
                    console.log("DragonBone code");
                    break;
                case 1:
                    if (tFileName.indexOf(".atlas") < 0)return null;
                    if (this.haveFile(name + ".png", fileArray)
                        && this.haveFile(name + ".atlas", fileArray)
                        && this.haveFile(name + ".json", fileArray)) {
                        return [tDir, 0, name];
                    }
                    break;
            }
            return null;
        }

        __proto.getFileName = function (path) {
            return this.nodePath.basename(path).split(".")[0];
        }

        __proto.getDir = function (path) {
            return this.nodePath.dirname(path);
        }

        /**
         *检测当前文件夹是否包含龙骨文件
         *@param type
         *@param name
         *@param fileArray
         *@return
         */
        __proto.checkIsExport = function (type, name, fileArray) {
            switch (type) {
                case 0:
                    if (this.haveFile("texture.png", fileArray)
                        && this.haveFile("texture.json", fileArray)
                        && this.haveFile(name + ".json", fileArray)) {
                        return 0;
                    }
                    if (this.haveFile(name + "_tex.png", fileArray)
                        && this.haveFile(name + "_tex.json", fileArray)
                        && this.haveFile(name + "_ske.json", fileArray)) {
                        return 2;
                    }
                    break;
                case 1:
                    if (this.haveFile(name + ".png", fileArray)
                        && this.haveFile(name + ".atlas", fileArray)
                        && this.haveFile(name + ".json", fileArray)) {
                        return 1;
                    }
                    break;
            }
            return -1;
        }

        /**
         *在文件列表中，查找是否有指定的文件
         *@param fileName
         *@param fileArray
         *@return
         */
        __proto.haveFile = function (fileName, fileArray) {
            var tPath;
            for (var i = 0; i < fileArray.length; i++) {
                tPath = fileArray[i];
                if (tPath) {
                    if (tPath.indexOf(fileName) > -1) {
                        return true;
                    }
                }
            }
            return false;
        }

        /**
         *
         *@param path
         *@param floor
         */
        __proto.handleFile = function (path, floor) {
            var blankStr = '';
            for (var i = 0; i < floor; i++) {
                blankStr += '    ';
            }
            this.fs.stat(path, function (err1, stats) {
                if (err1) {
                    console.log('stat error');
                } else {
                    if (stats.isDirectory()) {
                        console.log('+' + blankStr + path);
                    } else {
                        console.log('-' + blankStr + path);
                    }
                }
            })
        }

        return DragonBoneTools;
    })()

    //class Tools
    var Tools = (function () {
        function Tools() {
            this.mFactoryType = 0;
        }

        __class(Tools, 'Tools');
        var __proto = Tools.prototype;
        __proto.testLoaderFile = function (type, name, path, dbTools, completeFun, failFun) {
        }
        __proto.getObjectBuffer = function (obj) {
            var i = 0, j = 0, k = 0, l = 0, n = 0;
            var bytes = new Byte();
            bytes.endian = "littleEndian";
            bytes.writeUTFString(obj.versionIdentifier);
            bytes.writeUTFString(obj.aniClassName);
            var kkk = 0;
            var stringArea = "";
            for (i = 0; i < obj.animationDatas.length; i++) {
                for (j = 0; j < obj.animationDatas[i].animationNodeDatas.length; j++) {
                    stringArea += obj.animationDatas[i].animationNodeDatas[j].name;
                    stringArea += "\n";
                    kkk++;
                }
                (i == obj.animationDatas.length - 1) ? stringArea += obj.animationDatas[i].name : stringArea += obj.animationDatas[i].name + "\n";
            }
            bytes.writeUTFString(stringArea);
            var animationNum = obj.animationDatas.length;
            bytes.writeUint8(animationNum);
            var pospublicDataAddr = bytes.pos;
            bytes.writeUint32(0);
            var posexternalDataAddr = bytes.pos;
            bytes.writeUint32(posexternalDataAddr);
            var tBoneNum = 0;
            var tLastBoneNum = 0;
            var poslocalAnimationData = bytes.pos;
            bytes.writeUint8(0);
            var keyframeParamsOffset = 0;
            for (i = 0; i < animationNum; i++) {
                tLastBoneNum = tBoneNum;
                tBoneNum += obj.animationDatas[i].animationNodeDatas.length;
                bytes.writeUint16(tBoneNum);
                tBoneNum++;
                bytes.writeFloat32(obj.animationDatas[i].duration);
                var boneCount = obj.animationDatas[i].animationNodeDatas.length;
                bytes.writeUint8(boneCount);
                for (j = 0; j < boneCount; j++) {
                    bytes.writeInt16(tLastBoneNum + j);
                    var parentIndex = -1;
                    if (obj.animationDatas[i].animationNodeDatas[j].parent != null) {
                        for (var jj = 0; jj < obj.animationDatas[i].animationNodeDatas.length; jj++) {
                            if (obj.animationDatas[i].animationNodeDatas[j].parent.name ==
                                obj.animationDatas[i].animationNodeDatas[jj].name) {
                                parentIndex = jj;
                                break;
                            }
                        }
                        ;
                        var animationNodeData = obj.animationDatas[i].animationNodeDatas[j].parent;
                    }
                    bytes.writeInt16(parentIndex);
                    var bIsUseLerp = 0;
                    bIsUseLerp = obj.animationDatas[i].animationNodeDatas[j].lerpType;
                    bytes.writeUint8(bIsUseLerp);
                    bytes.writeUint32(keyframeParamsOffset);
                    keyframeParamsOffset += (obj.animationDatas[i].animationNodeDatas[j].keyFrameLerpTypes.length + 2);
                    var privateDataLen = obj.animationDatas[i].animationNodeDatas[j].privateData.length;
                    bytes.writeUint16(privateDataLen);
                    for (k = 0; k < privateDataLen; k++)
                        bytes.writeByte(obj.animationDatas[i].animationNodeDatas[j].privateData[k]);
                    var keyframeCount = obj.animationDatas[i].animationNodeDatas[j].keyFrameDatas.length;
                    bytes.writeUint16(keyframeCount);
                    for (k = 0; k < obj.animationDatas[i].animationNodeDatas[j].keyFrameDatas.length; k++) {
                        bytes.writeFloat32(obj.animationDatas[i].animationNodeDatas[j].keyFrameDatas[k].time);
                        if (bIsUseLerp == 2) {
                            var tlerpData = obj.animationDatas[i].animationNodeDatas[j].keyFrameDatas[k].interpolationData;
                            bytes.writeUint8(tlerpData.length);
                            for (l = 0; l < tlerpData.length; l++) {
                                bytes.writeFloat32(tlerpData[l]);
                            }
                        }
                        for (l = 0; l < obj.animationDatas[i].animationNodeDatas[j].keyFrameDatas[k].data.length; l++) {
                            bytes.writeFloat32(obj.animationDatas[i].animationNodeDatas[j].keyFrameDatas[k].data[l]);
                        }
                    }
                }
            }
            ;
            var nPublicAddr = bytes.pos;
            var tKeyFrameWidth = 0;
            for (i = 0; i < obj.animationDatas.length; i++) {
                if (obj.animationDatas[i].animationNodeDatas.length > 0) {
                    if (obj.animationDatas[i].animationNodeDatas.length > 0) {
                        for (j = 0; j < obj.animationDatas[i].animationNodeDatas.length; j++) {
                            tKeyFrameWidth = obj.animationDatas[i].animationNodeDatas[j].keyFrameWidth;
                            bytes.writeUint16(tKeyFrameWidth);
                            var tDataArray = obj.animationDatas[i].animationNodeDatas[j].keyFrameLerpTypes;
                            for (k = 0; k < tDataArray.length; k++) {
                                bytes.writeUint8(tDataArray[k]);
                            }
                        }
                    } else {
                        bytes.writeInt16(0);
                    }
                }
                else {
                    bytes.writeUint16(0);
                }
            }
            ;
            var nExternalAddr = bytes.pos;
            var tTextureData;
            var tTextureDataArray = obj.extenData.textureData;
            if (tTextureDataArray) {
                bytes.writeInt32(tTextureDataArray.length);
                var tTextureNameStr = "";
                if (tTextureDataArray.length > 0) {
                    for (i = 0, n = tTextureDataArray.length; i < n; i++) {
                        tTextureData = tTextureDataArray[i];
                        tTextureNameStr += tTextureData.textureSrc + "\n";
                        tTextureNameStr += tTextureData.name + "\n";
                    }
                }
                tTextureNameStr.substr(0, tTextureNameStr.length - 2);
                bytes.writeUTFString(tTextureNameStr);
                for (i = 0, n = tTextureDataArray.length; i < n; i++) {
                    tTextureData = tTextureDataArray[i];
                    bytes.writeFloat32(tTextureData.x);
                    bytes.writeFloat32(tTextureData.y);
                    bytes.writeFloat32(tTextureData.w);
                    bytes.writeFloat32(tTextureData.h);
                    bytes.writeFloat32(tTextureData.frameX);
                    bytes.writeFloat32(tTextureData.frameY);
                    bytes.writeFloat32(tTextureData.frameW);
                    bytes.writeFloat32(tTextureData.frameH);
                }
            } else {
                bytes.writeUint8(0);
            }
            ;
            var tAnimationData;
            bytes.writeUint16(obj.animationDatas.length);
            for (i = 0; i < obj.animationDatas.length; i++) {
                tAnimationData = obj.animationDatas[i];
                bytes.writeUint16(tAnimationData.boneLen);
                bytes.writeUint16(tAnimationData.slotLen);
                bytes.writeUint16(tAnimationData.ikLen);
                bytes.writeUint16(tAnimationData.pathLen);
            }
            ;
            var tDBBoneData;
            var tBoneArr = obj.extenData.boneArr;
            bytes.writeInt16(tBoneArr.length);
            for (i = 0; i < tBoneArr.length; i++) {
                tDBBoneData = tBoneArr[i];
                bytes.writeUTFString(tDBBoneData.name);
                bytes.writeUTFString(tDBBoneData.parent);
                bytes.writeFloat32(tDBBoneData.length);
                if (tDBBoneData.inheritRotation) {
                    bytes.writeByte(0);
                } else {
                    bytes.writeByte(1);
                }
                if (tDBBoneData.inheritScale) {
                    bytes.writeByte(0);
                } else {
                    bytes.writeByte(1);
                }
            }
            ;
            var tMatrixDataLen = obj.extenData.matrixDataLen;
            var tLen = obj.extenData.srcBoneMatrixLength;
            var tBoneMatrixArr = obj.extenData.srcBoneMatrix;
            bytes.writeUint16(tMatrixDataLen);
            bytes.writeUint16(tLen);
            for (i = 0; i < tLen; i++) {
                bytes.writeFloat32(tBoneMatrixArr[i]);
            }
            ;
            var tIkConstraintData;
            var tIkArr = obj.extenData.ikArr;
            bytes.writeUint16(tIkArr.length);
            for (i = 0; i < tIkArr.length; i++) {
                tIkConstraintData = tIkArr[i];
                bytes.writeUint16(tIkConstraintData.boneNames.length);
                for (j = 0; j < tIkConstraintData.boneNames.length; j++) {
                    bytes.writeUTFString(tIkConstraintData.boneNames[j]);
                    bytes.writeInt16(tIkConstraintData.boneIndexs[j]);
                }
                bytes.writeUTFString(tIkConstraintData.name);
                bytes.writeUTFString(tIkConstraintData.targetBoneName);
                bytes.writeInt16(tIkConstraintData.targetBoneIndex);
                bytes.writeFloat32(tIkConstraintData.bendDirection);
                bytes.writeFloat32(tIkConstraintData.mix);
            }
            ;
            var tTransformConstraintData;
            var tTransArr = obj.extenData.transData;
            bytes.writeUint16(tTransArr.length);
            for (i = 0; i < tTransArr.length; i++) {
                tTransformConstraintData = tTransArr[i];
                bytes.writeUint16(tTransformConstraintData.boneIndexs.length);
                for (j = 0; j < tTransformConstraintData.boneIndexs.length; j++) {
                    bytes.writeInt16(tTransformConstraintData.boneIndexs[j]);
                }
                bytes.writeUTFString(tTransformConstraintData.name);
                bytes.writeUint16(tTransformConstraintData.target);
                bytes.writeFloat32(tTransformConstraintData.rotateMix);
                bytes.writeFloat32(tTransformConstraintData.translateMix);
                bytes.writeFloat32(tTransformConstraintData.scaleMix);
                bytes.writeFloat32(tTransformConstraintData.shearMix);
                bytes.writeFloat32(tTransformConstraintData.offsetRotation);
                bytes.writeFloat32(tTransformConstraintData.offsetX);
                bytes.writeFloat32(tTransformConstraintData.offsetY);
                bytes.writeFloat32(tTransformConstraintData.offsetScaleX);
                bytes.writeFloat32(tTransformConstraintData.offsetScaleY);
                bytes.writeFloat32(tTransformConstraintData.offsetShearY);
            }
            ;
            var tPathConstraintData;
            var tPathArr = obj.extenData.pathArr;
            bytes.writeUint16(tPathArr.length);
            for (i = 0; i < tPathArr.length; i++) {
                tPathConstraintData = tPathArr[i];
                bytes.writeUTFString(tPathConstraintData.name);
                bytes.writeUint16(tPathConstraintData.bones.length);
                for (j = 0; j < tPathConstraintData.bones.length; j++) {
                    bytes.writeInt16(tPathConstraintData.boneIds[j]);
                }
                bytes.writeUTFString(tPathConstraintData.target);
                bytes.writeUTFString(tPathConstraintData.positionMode);
                bytes.writeUTFString(tPathConstraintData.spacingMode);
                bytes.writeUTFString(tPathConstraintData.rotateMode);
                bytes.writeFloat32(tPathConstraintData.offsetRotation);
                bytes.writeFloat32(tPathConstraintData.position);
                bytes.writeFloat32(tPathConstraintData.spacing);
                bytes.writeFloat32(tPathConstraintData.rotateMix);
                bytes.writeFloat32(tPathConstraintData.translateMix);
            }
            ;
            var tSkinAniList;
            var tSkinAni;
            var tDeformSlotAni;
            var tDeformSlotDisplayAni;
            var tDeformAniArr = obj.extenData.deformAniData;
            var tDeformVertices;
            bytes.writeInt16(tDeformAniArr.length);
            for (i = 0; i < tDeformAniArr.length; i++) {
                tSkinAniList = tDeformAniArr[i];
                bytes.writeUint8(tSkinAniList.length);
                for (var f = 0; f < tSkinAniList.length; f++) {
                    tSkinAni = tSkinAniList[f];
                    if (!tSkinAni) {
                        tSkinAni = new DeformSkinAni();
                    }
                    bytes.writeUTFString(tSkinAni.name);
                    bytes.writeInt16(tSkinAni.deformSlotArray.length);
                    for (j = 0; j < tSkinAni.deformSlotArray.length; j++) {
                        tDeformSlotAni = tSkinAni.deformSlotArray[j];
                        bytes.writeInt16(tDeformSlotAni.mDisplayArray.length);
                        for (k = 0; k < tDeformSlotAni.mDisplayArray.length; k++) {
                            tDeformSlotDisplayAni = tDeformSlotAni.mDisplayArray[k];
                            bytes.writeInt16(tDeformSlotDisplayAni.slotIndex);
                            bytes.writeUTFString(tDeformSlotDisplayAni.attachment);
                            bytes.writeInt16(tDeformSlotDisplayAni.timeList.length);
                            for (l = 0; l < tDeformSlotDisplayAni.timeList.length; l++) {
                                if (tDeformSlotDisplayAni.tweenKeyList[l]) {
                                    bytes.writeByte(1);
                                } else {
                                    bytes.writeByte(0);
                                }
                                bytes.writeFloat32(tDeformSlotDisplayAni.timeList[l]);
                                tDeformVertices = tDeformSlotDisplayAni.vectices[l];
                                bytes.writeInt16(tDeformVertices.length);
                                for (n = 0; n < tDeformVertices.length; n++) {
                                    bytes.writeFloat32(tDeformVertices[n]);
                                }
                            }
                        }
                    }
                }
            }
            ;
            var tDoAniData;
            var tDOArr;
            var tDOAniDAtaArr = obj.extenData.drawOrderAniData;
            bytes.writeInt16(tDOAniDAtaArr.length);
            for (i = 0; i < tDOAniDAtaArr.length; i++) {
                tDOArr = tDOAniDAtaArr[i];
                bytes.writeInt16(tDOArr.length);
                for (j = 0; j < tDOArr.length; j++) {
                    tDoAniData = tDOArr[j];
                    bytes.writeFloat32(tDoAniData.time);
                    bytes.writeInt16(tDoAniData.orderArr.length);
                    for (k = 0; k < tDoAniData.orderArr.length; k++) {
                        bytes.writeInt16(tDoAniData.orderArr[k]);
                    }
                }
            }
            ;
            var tEventData;
            var tEventArr;
            var tEventAniArr = obj.extenData.eventAniData;
            bytes.writeInt16(tEventAniArr.length);
            for (i = 0; i < tEventAniArr.length; i++) {
                tEventArr = tEventAniArr[i];
                bytes.writeInt16(tEventArr.length);
                for (j = 0; j < tEventArr.length; j++) {
                    tEventData = tEventArr[j];
                    bytes.writeUTFString(tEventData.name);
                    bytes.writeInt32(tEventData.intValue);
                    bytes.writeFloat32(tEventData.floatValue);
                    bytes.writeUTFString(tEventData.stringValue);
                    bytes.writeFloat32(tEventData.time);
                }
            }
            ;
            var tAttachName;
            var tAttachNames = obj.extenData.attachments;
            bytes.writeInt16(tAttachNames.length);
            for (i = 0; i < tAttachNames.length; i++) {
                tAttachName = tAttachNames[i];
                bytes.writeUTFString(tAttachName);
            }
            ;
            var tBoneSlotData;
            var tBoneSlotArr = obj.extenData.BoneSlotArr;
            bytes.writeInt16(tBoneSlotArr.length);
            for (i = 0; i < tBoneSlotArr.length; i++) {
                tBoneSlotData = tBoneSlotArr[i];
                if (tBoneSlotData) {
                    bytes.writeUTFString(tBoneSlotData.name);
                    bytes.writeUTFString(tBoneSlotData.parent);
                    bytes.writeUTFString(tBoneSlotData.attachmentName);
                    bytes.writeInt16(tBoneSlotData.displayIndex);
                }
            }
            ;
            var tSkinData;
            var tSlotData;
            var tDisplayData;
            var tSkinDataArr = obj.extenData.SkinArr;
            var tString = "";
            for (i = 0; i < tSkinDataArr.length; i++) {
                tSkinData = tSkinDataArr[i];
                tString += tSkinData.name + "\n";
                for (j = 0; j < tSkinData.slotArr.length; j++) {
                    tSlotData = tSkinData.slotArr[j];
                    tString += tSlotData.name + "\n";
                    for (k = 0; k < tSlotData.displayArr.length; k++) {
                        tDisplayData = tSlotData.displayArr[k];
                        tString += tDisplayData.name + "\n";
                        tString += tDisplayData.attachmentName + "\n";
                    }
                }
            }
            tString.substr(0, tString.length - 2);
            bytes.writeUTFString(tString);
            bytes.writeUint8(tSkinDataArr.length);
            for (i = 0; i < tSkinDataArr.length; i++) {
                tSkinData = tSkinDataArr[i];
                bytes.writeUint8(tSkinData.slotArr.length);
                for (j = 0; j < tSkinData.slotArr.length; j++) {
                    tSlotData = tSkinData.slotArr[j];
                    bytes.writeUint8(tSlotData.displayArr.length);
                    for (k = 0; k < tSlotData.displayArr.length; k++) {
                        tDisplayData = tSlotData.displayArr[k];
                        bytes.writeFloat32(tDisplayData.transform.scX);
                        bytes.writeFloat32(tDisplayData.transform.skX);
                        bytes.writeFloat32(tDisplayData.transform.skY);
                        bytes.writeFloat32(tDisplayData.transform.scY);
                        bytes.writeFloat32(tDisplayData.transform.x);
                        bytes.writeFloat32(tDisplayData.transform.y);
                        bytes.writeFloat32(tDisplayData.width);
                        bytes.writeFloat32(tDisplayData.height);
                        bytes.writeUint8(tDisplayData.type);
                        bytes.writeUint16(tDisplayData.vertexLen);
                        switch (tDisplayData.type) {
                            case 0:
                            case 1:
                            case 2:
                            case 3:
                                ;
                                var tBonePose = tDisplayData.bonePose;
                                bytes.writeUint16(tBonePose.length);
                                for (l = 0; l < tBonePose.length; l++) {
                                    bytes.writeUint16(tBonePose[l]);
                                }
                                ;
                                var tUvs = tDisplayData.uvs;
                                bytes.writeUint16(tUvs.length);
                                for (l = 0; l < tUvs.length; l++) {
                                    bytes.writeFloat32(tUvs[l]);
                                }
                                ;
                                var tWeights = tDisplayData.weights;
                                bytes.writeUint16(tWeights.length);
                                for (l = 0; l < tWeights.length; l++) {
                                    bytes.writeFloat32(tWeights[l]);
                                }
                                ;
                                var tTriangles = tDisplayData.triangles;
                                bytes.writeUint16(tTriangles.length);
                                for (l = 0; l < tTriangles.length; l++) {
                                    bytes.writeUint16(tTriangles[l]);
                                }
                                ;
                                var tVertices = tDisplayData.vertices;
                                bytes.writeUint16(tVertices.length);
                                for (l = 0; l < tVertices.length; l++) {
                                    bytes.writeFloat32(tVertices[l]);
                                }
                                ;
                                var tLenghts = tDisplayData.lengths;
                                bytes.writeUint16(tLenghts.length);
                                for (l = 0; l < tLenghts.length; l++) {
                                    bytes.writeFloat32(tLenghts[l]);
                                }
                                break;
                        }
                    }
                }
            }
            bytes.writeUint8(this.mFactoryType);
            bytes.pos = pospublicDataAddr;
            bytes.writeUint32(nPublicAddr);
            bytes.pos = posexternalDataAddr;
            bytes.writeUint32(nExternalAddr);
            bytes.pos = 0;
            return bytes.buffer;
        }

        __proto.save = function (filename, dataView) {
        }
        return Tools;
    })()

    //class dragonBones.BoneAniTools extends Tools
    var BoneAniTools = (function (_super) {
        function BoneAniTools() {
            this.mTexturePath = null;
            this.mTextureJsonPath = null;
            this.mSkeletonJsonPath = null;
            this.mSaveAniPath = null;
            this.mSaveTexturePath = null;
            this.mTexture = null;
            this.mTextureJson = null;
            this.mSkeletonJson = null;
            this.versionPath = "version4.5";
            this.DBFileName = "man";
            this.mCompleteFun = null;
            this.mFailFun = null;
            this.mSpineFactory = null;
            this.mDBFactory = null;
            this.mDBTools = null;
            this.mNodePath = null;
            this.tExType = 0;
            this.mTexturePathList = null;
            BoneAniTools.__super.call(this);
            // if (Laya.stage == null) {
            //     Laya.init(1, 1);
            // }
        }

        __class(BoneAniTools, 'dragonBones.BoneAniTools', _super);
        var __proto = BoneAniTools.prototype;

        __proto.loadTestFile = function(){
            this.mFactoryType = 1;
            this.mTexturePath = "res/spine/spineboy.png";
            this.mTextureJsonPath = "res/spine/spineboy.atlas";
            this.mSkeletonJsonPath = "res/spine/spineboy.json";
            Laya.loader.load([
                {url: this.mTexturePath, type: "image"},
                {url: this.mTextureJsonPath, type: "text"},
                {url: this.mSkeletonJsonPath, type: "json"}
                ], Handler.create(this, this.onLoadedTestFile), null, null, 1, true);

        }
        __proto.onLoadedTestFile = function () {
            this.mTexture = Loader.getRes(this.mTexturePath);
            this.mTextureJson = Loader.getRes(this.mTextureJsonPath);
            this.mSkeletonJson = Loader.getRes(this.mSkeletonJsonPath);
            var tVer;
            tVer = this.getSkeletonVersion(this.mSkeletonJson, this.mFactoryType);
            // if (!this.isSkeletonVersionOK(tVer, this.mFactoryType)) {
            //     this.onErrorVersion(tVer);
            // }
            switch (this.mFactoryType) {
                case 0:
                    this.loadComplete();
                    break;
                case 1:
                    try {
                        var tAtlas = new Atlas();
                        this.mTexturePathList = tAtlas.preInit(this.mTextureJson);
                        var tLoadList = [];
                        var tObject;
                        var tPath;
                        for (var i = 0; i < this.mTexturePathList.length; i++) {
                            tPath = this.join(this.versionPath, this.mTexturePathList[i]);
                            tObject = {url: tPath, type: "image"};
                            tLoadList.push(tObject);
                        }
                        Laya.loader.load(tLoadList, Handler.create(this, this.loadComplete));
                    } catch (e) {
                        this.onError("纹理头解析出错:" + e);
                    }
                    break;
            }
        }
        __proto.loadFile = function (nodePath, dbTools, path, outPath, completeFun, failFun, type, eType, tDBFileName) {
            (type === void 0) && (type = 0);
            (eType === void 0) && (eType = 0);
            this.mNodePath = nodePath;
            this.mDBTools = dbTools;
            BoneAniTools.mBoneToolsKey = true;
            this.mFactoryType = type;
            var fileName;
            this.DBFileName = tDBFileName || nodePath.basename(path).split(".")[0];
            this.versionPath = path;
            this.mCompleteFun = completeFun;
            this.mFailFun = failFun;
            Laya.loader.on("error", this, this.onError)
            this.tExType = eType;
            switch (type) {
                case 0:
                    // Dragon bone
                    if (eType == 2) {
                        this.mTexturePath = nodePath.join(this.versionPath, this.DBFileName + "_tex.png");
                        this.mTextureJsonPath = nodePath.join(this.versionPath, this.DBFileName + "_tex.json");
                        this.mSkeletonJsonPath = nodePath.join(this.versionPath, this.DBFileName + "_ske.json");
                    } else {
                        this.mTexturePath = nodePath.join(this.versionPath, "texture.png");
                        this.mTextureJsonPath = nodePath.join(this.versionPath, "texture.json");
                        this.mSkeletonJsonPath = nodePath.join(this.versionPath, this.DBFileName + ".json");
                    }
                    this.mSaveAniPath = nodePath.join(outPath, this.DBFileName + ".sk");
                    this.mSaveTexturePath = outPath;
                    Laya.loader.load([{url: this.mTexturePath, type: "image"},
                        {url: this.mTextureJsonPath, type: "json"},
                        {
                            url: this.mSkeletonJsonPath,
                            type: "json"
                        }], Handler.create(this, this.onLoaded), null, null, 1, true);
                    break;
                case 1:
                    // spine
                    this.mTexturePath = nodePath.join(this.versionPath, this.DBFileName + ".png");
                    this.mTextureJsonPath = nodePath.join(this.versionPath, this.DBFileName + ".atlas");
                    this.mSkeletonJsonPath = nodePath.join(this.versionPath, this.DBFileName + ".json");
                    this.mSaveAniPath = nodePath.join(outPath, this.DBFileName + ".sk");
                    this.mSaveTexturePath = outPath;
                    Laya.loader.load([{url: this.mTexturePath, type: "image"},
                        {url: this.mTextureJsonPath, type: "text"},
                        {
                            url: this.mSkeletonJsonPath,
                            type: "json"
                        }], Handler.create(this, this.onLoaded), null, null, 1, true);
                    break;
            }
        }

        __proto.testLoaderFile = function (type, name, path, dbTools, completeFun, failFun) {
            this.mDBTools = dbTools;
            this.mFactoryType = type;
            var fileName;
            this.DBFileName = name;
            this.versionPath = path;
            this.mCompleteFun = completeFun;
            this.mFailFun = failFun;
            Laya.loader.on("error", this, this.onError)
            switch (type) {
                case 0:
                    if (this.tExType == 2) {
                        this.mTexturePath = this.versionPath + "/" + this.DBFileName + "_tex.png";
                        this.mTextureJsonPath = this.versionPath + "/" + this.DBFileName + "_tex.json";
                        this.mSkeletonJsonPath = this.versionPath + "/" + this.DBFileName + "_ske.json";
                    } else {
                        this.mTexturePath = this.versionPath + "/texture.png";
                        this.mTextureJsonPath = this.versionPath + "/texture.json";
                        this.mSkeletonJsonPath = this.versionPath + "/" + this.DBFileName + ".json";
                    }
                    this.mSaveAniPath = this.versionPath + this.DBFileName;
                    Laya.loader.load([{url: this.mTexturePath, type: "image"},
                        {url: this.mTextureJsonPath, type: "json"},
                        {url: this.mSkeletonJsonPath, type: "json"}], Handler.create(this, this.onLoaded));
                    break;
                case 1:
                    this.mTexturePath = this.versionPath + "/" + this.DBFileName + ".png";
                    this.mTextureJsonPath = this.versionPath + "/" + this.DBFileName + ".atlas";
                    this.mSkeletonJsonPath = this.versionPath + "/" + this.DBFileName + ".json";
                    this.mSaveAniPath = this.versionPath + this.DBFileName;
                    Laya.loader.load([{url: this.mTexturePath, type: "image"},
                        {url: this.mTextureJsonPath, type: "text"},
                        {url: this.mSkeletonJsonPath, type: "json"}], Handler.create(this, this.onLoaded));
                    break;
            }
        }

        __proto.onError = function (err) {
            var tErrInfo = "---" + this.DBFileName + "---" + "加载错误:" + err;
            if (this.mFailFun != null) {
                this.mFailFun.call(this.mDBTools, tErrInfo);
                this.clear();
            }
        }

        __proto.onErrorVersion = function (ver) {
            var msg;
            switch (this.mFactoryType) {
                case 0:
                    msg = "DragonBone支持版本为:" + "4.5" + "~" + "4.9.5" + "" + "当前文件版本为" + ver;
                    break;
                case 1:
                    msg = "Spine支持版本为:" + "3.4.0.2" + "~" + "3.5.46" + "" + "当前文件版本为" + ver;
                    break;
            }
            if (this.mFailFun != null) {
                msg += "\n动画结果可能不正确:" + this.mSkeletonJsonPath;
                this.mFailFun.call(this.mDBTools, msg);
            }
        }

        __proto.onLoaded = function () {
            this.mTexture = Loader.getRes(this.mTexturePath);
            this.mTextureJson = Loader.getRes(this.mTextureJsonPath);
            this.mSkeletonJson = Loader.getRes(this.mSkeletonJsonPath);
            var tVer;
            tVer = this.getSkeletonVersion(this.mSkeletonJson, this.mFactoryType);
            if (!this.isSkeletonVersionOK(tVer, this.mFactoryType)) {
                this.onErrorVersion(tVer);
            }
            switch (this.mFactoryType) {
                case 0:
                    this.loadComplete();
                    break;
                case 1:
                    try {
                        var tAtlas = new Atlas();
                        this.mTexturePathList = tAtlas.preInit(this.mTextureJson);
                        var tLoadList = [];
                        var tObject;
                        var tPath;
                        for (var i = 0; i < this.mTexturePathList.length; i++) {
                            tPath = this.join(this.versionPath, this.mTexturePathList[i]);
                            tObject = {url: tPath, type: "image"};
                            tLoadList.push(tObject);
                        }
                        Laya.loader.load(tLoadList, Handler.create(this, this.loadComplete));
                    } catch (e) {
                        this.onError("纹理头解析出错:" + e);
                    }
                    break;
            }
        }

        __proto.getSkeletonVersion = function (dataO, type) {
            var ver;
            var verNum = NaN;
            var isOk = false;
            switch (type) {
                case 0:
                    ver = dataO.version;
                    verNum = BoneAniTools.getVerNum(ver);
                    isOk = verNum >= BoneAniTools.MinDragonNum && verNum <= BoneAniTools.MaxDragonNum;
                    break;
                case 1:
                    ver = dataO.skeleton.spine;
                    verNum = BoneAniTools.getVerNum(ver);
                    isOk = verNum >= BoneAniTools.MinSpineNum && verNum <= BoneAniTools.MaxSpineNum;
                    break;
            }
            console.log("skeletonVer:", ver, isOk);
            return ver;
        }

        __proto.isSkeletonVersionOK = function (ver, type) {
            var isOk = false;
            var verNum = NaN;
            switch (type) {
                case 0:
                    verNum = BoneAniTools.getVerNum(ver);
                    isOk = verNum >= BoneAniTools.MinDragonNum && verNum <= BoneAniTools.MaxDragonNum;
                    break;
                case 1:
                    verNum = BoneAniTools.getVerNum(ver);
                    isOk = verNum >= BoneAniTools.MinSpineNum && verNum <= BoneAniTools.MaxSpineNum;
                    break;
            }
            return isOk;
        }

        __proto.loadComplete = function () {
            var tTextureName;
            var i = 0;
            try {
                switch (this.mFactoryType) {
                    case 0:
                        this.mDBFactory = new LayaFactory()
                        this.mDBFactory.on("complete", this, this.onCompleteHandler);
                        this.mDBFactory.parseData(this.mTexture, this.mTextureJson, this.mSkeletonJson, this.DBFileName + ".png");
                        break;
                    case 1:
                        this.mSpineFactory = new SpineFactory();
                        this.mSpineFactory.on("complete", this, this.onCompleteHandler);
                        var tTextureMap = {};
                        var tTexture;
                        for (i = 0; i < this.mTexturePathList.length; i++) {
                            tTextureName = this.mTexturePathList[i];
                            tTexture = Loader.getRes(this.join(this.versionPath, tTextureName));
                            tTextureMap[tTextureName] = tTexture;
                        }
                        this.mSpineFactory.parseData(tTextureMap, this.mTextureJson, this.mSkeletonJson);
                        break;
                }
            } catch (e) {
                this.onError("解析文件出错:" + e);
            }
        }

        __proto.onCompleteHandler = function () {
            var testLayaAnimation = new TestLayaAnimation();
            var tLayaAni;
            var stringJSON;
            try {
                switch (this.mFactoryType) {
                    case 0:
                        tLayaAni = testLayaAnimation.getLayaBoneAni(this.mDBFactory.mArmatureArr, this.mDBFactory.mDBTextureDataArray, "Dragon");
                        break;
                    case 1:
                        tLayaAni = testLayaAnimation.getLayaBoneAni(this.mSpineFactory.mSkeletonData.mArmatureArr, this.mSpineFactory.mDBTextureDataArray);
                        break;
                }
            } catch (e) {
                this.onError("组织数据出错:" + e);
            }
            try {
                var buffer = this.getObjectBuffer(tLayaAni);
            } catch (e) {
                this.onError("导出二进制数据出错:" + e);
            }
            this.save(this.mSaveAniPath, buffer);
        }

        //保存文件
        __proto.save = function (filename, dataView) {
            var tTextureList = [];
            var tTextureOutList = [];
            try {
                if (BoneAniTools.mBoneToolsKey) {
                    var tTextureName;
                    switch (this.mFactoryType) {
                        case 0:
                            if (this.tExType == 2) {
                                tTextureList.push(this.join(this.versionPath, this.DBFileName + "_tex.png"));
                            } else {
                                tTextureList.push(this.join(this.versionPath, "texture.png"));
                            }
                            tTextureOutList.push(this.join(this.mSaveTexturePath, this.DBFileName + ".png"));
                            break;
                        case 1:
                            for (var i = 0; i < this.mTexturePathList.length; i++) {
                                tTextureName = this.mTexturePathList[i];
                                tTextureList.push(this.join(this.versionPath, tTextureName));
                                tTextureOutList.push(this.join(this.mSaveTexturePath, tTextureName));
                            }
                            break;
                    }
                }
            } catch (e) {
                this.onError("清除loader资源出错:" + e);
            }
            this.mCompleteFun.call(this.mDBTools, filename, dataView, tTextureList, tTextureOutList);
        }

        __proto.clear = function () {
            try {
                if (BoneAniTools.mBoneToolsKey) {
                    Loader.clearRes(this.mTexturePath);
                    Loader.clearRes(this.mTextureJsonPath);
                    Loader.clearRes(this.mSkeletonJsonPath);
                    var tTextureName;
                    if (this.mTexturePathList) {
                        switch (this.mFactoryType) {
                            case 1:
                                for (var i = 0; i < this.mTexturePathList.length; i++) {
                                    tTextureName = this.mTexturePathList[i];
                                    Loader.clearRes(this.join(this.versionPath, tTextureName));
                                }
                                break;
                        }
                        this.mTexturePathList.length = 0;
                    }
                }
            } catch (e) {
                this.onError("清除loader资源出错:" + e);
            }
        }

        __proto.join = function (str1, str2) {
            var tOut;
            if (this.mNodePath) {
                tOut = this.mNodePath.join(str1, str2);
            } else {
                tOut = str1 + "/" + str2;
            }
            return tOut;
        }

        BoneAniTools.getVerNum = function (ver) {
            var nums;
            nums = ver.split(".");
            var i = 0, len = 0;
            len = nums.length;
            var rst = NaN;
            rst = 0;
            var tWeight = NaN;
            tWeight = 1;
            var tValue = NaN;
            for (i = 0; i < len; i++) {
                tValue = parseInt(nums[i]);
                if (isNaN(tValue)) {
                    tValue = 0;
                }
                rst += tValue * tWeight;
                tWeight *= 0.01;
            }
            return rst;
        }

        BoneAniTools.mBoneToolsKey = false;
        BoneAniTools.MinSpine = "3.4.0.2";
        BoneAniTools.MaxSpine = "3.5.46";
        BoneAniTools.MinDragon = "4.5";
        BoneAniTools.MaxDragon = "4.9.5";
        __static(BoneAniTools,
            ['MinSpineNum', function () {
                return this.MinSpineNum = BoneAniTools.getVerNum("3.4.0.2");
            }, 'MaxSpineNum', function () {
                return this.MaxSpineNum = BoneAniTools.getVerNum("3.5.46");
            }, 'MinDragonNum', function () {
                return this.MinDragonNum = BoneAniTools.getVerNum("4.5");
            }, 'MaxDragonNum', function () {
                return this.MaxDragonNum = BoneAniTools.getVerNum("4.9.5");
            }
            ]);
        return BoneAniTools;
    })(Tools)

    // Laya.__init([DBAnimationData]);
})(window, document, Laya);
