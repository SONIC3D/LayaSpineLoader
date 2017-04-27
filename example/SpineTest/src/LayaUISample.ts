import test = ui.test.TestPageUI;
import Label = laya.ui.Label;
import Handler = laya.utils.Handler;
import Loader = laya.net.Loader;
import Stat      = Laya.Stat;
import WebGL     = Laya.WebGL;
import Skeleton  = Laya.Skeleton;
import Templet = Laya.SpineAnimationTemplet;

class TestUI extends ui.test.TestPageUI {

    constructor() {
        super();
    }

    private m_SpineDir: string;
    private m_SpineFilename: string;
    private m_Factory: Templet;
    private m_Armature: Skeleton;
    private m_CurrIndex: number = 0;

    public startFun(): void {
        this.m_SpineDir = "res/spine";
        this.m_SpineFilename = "spineboy";
        this.m_Factory = new Templet();
        this.m_Factory.on(laya.events.Event.COMPLETE, this, this.parseComplete);
        this.m_Factory.on(laya.events.Event.ERROR, this, this.onError);
        this.m_Factory.loadSpineAni(this.m_SpineDir, this.m_SpineFilename);
    }

    private onError(): void {
        console.log("error");
    }

    private parseComplete(): void {
        // Set aniMode to 1 to enable skinning
        this.m_Armature = this.m_Factory.buildArmature(1);
        this.m_Armature.x = 300;
        this.m_Armature.y = 380;
        this.m_Armature.scale(0.5, 0.5);
        Laya.stage.addChild(this.m_Armature);
        this.m_Armature.on(laya.events.Event.STOPPED, this, this.completeHandler);
        this.play();
    }

    private completeHandler(): void {
        this.play();
    }

    private play(): void {
        this.m_CurrIndex++;
        if (this.m_CurrIndex >= this.m_Armature.getAnimNum()) {
            this.m_CurrIndex = 0;
        }
        this.m_Armature.play(this.m_CurrIndex, false);
    }
}


// Program Entry
Laya.init(600, 400);
Stat.show();
let mainUI: TestUI = new TestUI();
mainUI.startFun();
