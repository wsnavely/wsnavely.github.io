var config = {
  type: Phaser.AUTO,
  width: 1000,
  height: 600,
  parent: "game",
  transparent: true,
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
  },
  audio: {
    disableWebAudio: true,
  },
};

var game = new Phaser.Game(config);

var objects;
var theme = {
  bg: 0xd73bb9,
  fg: 0xfac7f0,
  left_panel: 0x3a84e9,
  right_panel: 0xb2905d,
  button_bg: 0x99dbf3,
  button_selected: 0xeae32e,
};

var score = {
  bass: [],
  treble: [],
};
var scoreLength = 11;
var currentVoice;
var voiceSelectors = [];
var isPlaying;

function preload() {
  this.load.image("bg", "/assets/images/bg.png");
  this.load.image("fg", "/assets/images/fg.png");
  this.load.image("left_panel", "/assets/images/left_panel.png");
  this.load.image("right_panel", "/assets/images/right_panel.png");
  this.load.image("button_bg", "/assets/images/button_bg.png");
  this.load.image("r2_button", "/assets/images/r2button.png");
  this.load.image("r2_note", "/assets/images/r2note.png");
  this.load.image("pig_button", "/assets/images/pigbutton.png");
  this.load.image("pig_note", "/assets/images/pignote.png");
  this.load.image("goose_button", "/assets/images/goosebutton.png");
  this.load.image("goose_note", "/assets/images/goosenote.png");
  this.load.image("play", "/assets/images/play.png");
  this.load.image("clefs", "/assets/images/clefs.png");
  this.load.image("spacenote", "/assets/images/spacenote.png");
  this.load.image("linenote", "/assets/images/linenote.png");
  this.load.image("panda", "/assets/images/panda.png");

  this.load.spritesheet(
    "rainbow_ss",
    "/assets/images/rainbow_spritesheet.png",
    {
      frameWidth: 105,
      frameHeight: 105,
    }
  );
  this.load.audioSprite(
    "r2_voice_treble",
    "/assets/audio/r2_audio_sprite.json",
    ["assets/audio/r2_audio_sprite.ogg", "/assets/audio/r2_audio_sprite.mp3"]
  );
  this.load.audioSprite("r2_voice_bass", "/assets/audio/r2_audio_sprite.json", [
    "assets/audio/r2_audio_sprite.ogg",
    "assets/audio/r2_audio_sprite.mp3",
  ]);
  this.load.audioSprite(
    "pig_voice_treble",
    "/assets/audio/pig_audio_sprite.json",
    ["assets/audio/pig_audio_sprite.ogg", "/assets/audio/pig_audio_sprite.mp3"]
  );
  this.load.audioSprite(
    "pig_voice_bass",
    "/assets/audio/pig_audio_sprite.json",
    ["assets/audio/pig_audio_sprite.ogg", "assets/audio/pig_audio_sprite.mp3"]
  );
  this.load.audioSprite(
    "guitar_voice_treble",
    "/assets/audio/guitar_audio_sprite.json",
    [
      "assets/audio/guitar_audio_sprite.ogg",
      "/assets/audio/guitar_audio_sprite.mp3",
    ]
  );
  this.load.audioSprite(
    "guitar_voice_bass",
    "/assets/audio/guitar_audio_sprite.json",
    [
      "assets/audio/guitar_audio_sprite.ogg",
      "assets/audio/guitar_audio_sprite.mp3",
    ]
  );
}

function make_button_column(scene, scoreIndex, x, y, notes, clef) {
  var yOffset = y;
  var lineHeight = 28;
  var spaceHeight = 28;
  var workList = [];
  var isLine = true;
  notes.forEach((elem) => {
    if (isLine) {
      workList.push({
        note: elem,
        xOffset: x,
        yOffset: yOffset,
        icon: "linenote",
      });
      yOffset += lineHeight;
      isLine = false;
    } else {
      workList.push({
        note: elem,
        xOffset: x,
        yOffset: yOffset,
        icon: "spacenote",
      });
      yOffset += spaceHeight;
      isLine = true;
    }
  });

  workList.forEach((task) => {
    var button = scene.add
      .image(task.xOffset, task.yOffset, task.icon)
      .setDepth(-1);
    button.setInteractive().on("pointerdown", function () {
      if (isPlaying) {
        return;
      }
      var addNote = true;
      if (score[clef][scoreIndex] !== null) {
        var curElem = score[clef][scoreIndex];
        if (
          curElem.note === task.note &&
          curElem.voice === currentVoice.voice[clef]
        ) {
          addNote = false;
        }
        curElem.icon.destroy();
        score[clef][scoreIndex] = null;
      }
      if (addNote) {
        score[clef][scoreIndex] = {
          note: task.note,
          voice: currentVoice.voice[clef],
          icon: scene.add.image(task.xOffset, task.yOffset, currentVoice.icon),
        };
        scene.sound.playAudioSprite(currentVoice.voice[clef], task.note);
      }
    });
  });
}

function select_voice(selector) {
  voiceSelectors.forEach((sel) => {
    sel.button.setTint(theme.button_bg);
  });
  selector.button.setTint(theme.button_selected);
  currentVoice = {
    voice: selector.voice,
    icon: selector.icon,
  };
}

function register_voice_selector(button, voice, icon) {
  var selector = { button: button, voice: voice, icon: icon };
  voiceSelectors.push(selector);
  button.setInteractive().on("pointerdown", function () {
    if (!isPlaying) {
      select_voice(selector);
    }
  });
  return selector;
}

var panda = null;

function playback(scene, onComplete) {
  var playBackTimeline = scene.tweens.createTimeline();
  var pandaXOffset = 295;
  var pandaYOffset = 306;
  var pandaInterval = 57;

  if (panda !== null) {
    panda.destroy();
  }
  panda = scene.add.image(pandaXOffset, pandaYOffset, "panda");
  var timePerNote = 500;

  for (index = 0; index < scoreLength; index++) {
    playBackTimeline.add({
      targets: panda,
      onComplete: function (tween, target, index) {
        var treble = score["treble"][index];
        if (treble !== null) {
          scene.sound.playAudioSprite(treble.voice, treble.note);
        }
        var bass = score["bass"][index];
        if (bass !== null) {
          scene.sound.playAudioSprite(bass.voice, bass.note);
        }
      },
      onCompleteParams: [index],
      duration: timePerNote,
      ease: "Linear",
      props: {
        x: {
          value: "+= " + pandaInterval,
        },
        rotation: {
          value: "+= 1",
        },
      },
      offset: index * timePerNote,
    });

    var trebleNote = score["treble"][index];
    if (trebleNote !== null) {
      playBackTimeline.add({
        targets: trebleNote.icon,
        duration: 200,
        yoyo: true,
        props: {
          y: "-= 10",
        },
        offset: index * timePerNote + 300,
      });
    }
    var bassNote = score["bass"][index];
    if (bassNote !== null) {
      playBackTimeline.add({
        targets: bassNote.icon,
        duration: 200,
        yoyo: true,
        props: {
          y: "-= 10",
        },
        offset: index * timePerNote + 300,
      });
    }
  }

  playBackTimeline.setCallback("onComplete", function () {
    isPlaying = false;
    if (onComplete) {
      onComplete();
    }
  });
  isPlaying = true;
  playBackTimeline.play();
}

function create() {
  var scene = this;

  objects = {
    bg: this.add.image(0, 0, "bg").setOrigin(0, 0),
    fg: this.add.image(0, 0, "fg").setOrigin(0, 0),
    left_panel: this.add.image(0, 0, "left_panel").setOrigin(0, 0),
    button1: this.add.image(35, 35, "button_bg").setOrigin(0, 0),
    button1_icon: this.add.image(87, 87, "r2_button"),
    button2: this.add.image(35, 150, "button_bg").setOrigin(0, 0),
    button2_icon: this.add.image(87, 200, "pig_button"),
    button3: this.add.image(35, 265, "button_bg").setOrigin(0, 0),
    button3_icon: this.add.image(87, 313, "goose_button"),
    button4: this.add.image(35, 380, "button_bg").setOrigin(0, 0),
    button4_icon: this.add.image(90, 430, "play"),
    clefs: this.add.image(0, 0, "clefs").setOrigin(0, 0),
  };

  var r2_voice_selector = register_voice_selector(
    objects.button1,
    {
      treble: "r2_voice_treble",
      bass: "r2_voice_bass",
    },
    "r2_note"
  );
  var pig_voice_selector = register_voice_selector(
    objects.button2,
    {
      treble: "pig_voice_treble",
      bass: "pig_voice_bass",
    },
    "pig_note"
  );
  var goose_voice_selector = register_voice_selector(
    objects.button3,
    {
      treble: "guitar_voice_treble",
      bass: "guitar_voice_bass",
    },
    "goose_note"
  );

  var index;
  var xOffset = 346;
  var colWidth = 57;
  var trebleNotes = ["f2", "e2", "d2", "c2", "b2", "a2", "g2", "f1", "e1"];
  var bassNotes = ["a1", "g1", "f0", "e0", "d0", "c0", "b0", "a0", "g0"];

  for (index = 0; index < scoreLength; index++) {
    score.treble.push(null);
    score.bass.push(null);
    make_button_column(scene, index, xOffset, 38, trebleNotes, "treble");
    make_button_column(scene, index, xOffset, 346, bassNotes, "bass");
    xOffset += colWidth;
  }

  applyTheme(objects, theme);
  select_voice(r2_voice_selector);
  isPlaying = false;

  score.treble[0] = {
    note: "g2",
    voice: r2_voice_selector.voice["treble"],
    icon: scene.add.image(346, 206, r2_voice_selector.icon),
  };
  score.bass[0] = {
    note: "g0",
    voice: goose_voice_selector.voice["bass"],
    icon: scene.add.image(346, 570, goose_voice_selector.icon),
  };
  score.treble[1] = {
    note: "g2",
    voice: r2_voice_selector.voice["treble"],
    icon: scene.add.image(403, 206, r2_voice_selector.icon),
  };
  score.bass[1] = {
    note: "g0",
    voice: goose_voice_selector.voice["bass"],
    icon: scene.add.image(403, 570, goose_voice_selector.icon),
  };
  score.treble[2] = {
    note: "a2",
    voice: r2_voice_selector.voice["treble"],
    icon: scene.add.image(460, 178, r2_voice_selector.icon),
  };
  score.bass[2] = {
    note: "c0",
    voice: goose_voice_selector.voice["bass"],
    icon: scene.add.image(460, 486, goose_voice_selector.icon),
  };
  score.treble[4] = {
    note: "g2",
    voice: r2_voice_selector.voice["treble"],
    icon: scene.add.image(574, 206, r2_voice_selector.icon),
  };
  score.bass[4] = {
    note: "c0",
    voice: pig_voice_selector.voice["bass"],
    icon: scene.add.image(574, 486, pig_voice_selector.icon),
  };
  score.treble[6] = {
    note: "c2",
    voice: r2_voice_selector.voice["treble"],
    icon: scene.add.image(688, 122, r2_voice_selector.icon),
  };
  score.bass[6] = {
    note: "f0",
    voice: goose_voice_selector.voice["bass"],
    icon: scene.add.image(688, 402, goose_voice_selector.icon),
  };
  score.treble[8] = {
    note: "b2",
    voice: r2_voice_selector.voice["treble"],
    icon: scene.add.image(802, 150, r2_voice_selector.icon),
  };
  score.bass[8] = {
    note: "g1",
    voice: goose_voice_selector.voice["bass"],
    icon: scene.add.image(802, 374, goose_voice_selector.icon),
  };
  score.bass[10] = {
    note: "g1",
    voice: pig_voice_selector.voice["bass"],
    icon: scene.add.image(916, 374, pig_voice_selector.icon),
  };

  objects.button4.setInteractive().on("pointerdown", function () {
    if (!isPlaying) {
      objects.button4.setTint(0xdb4b4b);
      playback(scene, function () {
        objects.button4.setTint(theme.button_bg);
      });
    }
  });
}

function applyTheme(gameObjects, colorTheme) {
  Object.keys(gameObjects).forEach(function (key) {
    var textureName = gameObjects[key].texture.key;
    if (textureName in colorTheme) {
      var tint = colorTheme[textureName];
      gameObjects[key].setTint(tint);
    }
  });
}

function update() {}
