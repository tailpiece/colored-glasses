<template>
  <div class="container">
    <ul class="nav nav-tabs">
      <li class="nav-item">
        <a :class="{'active': !editor}" @click="tabChange('colors')" class="nav-link">
          <font-awesome-icon icon="border-all" />
        </a>
      </li>
      <li class="nav-item">
        <a :class="{'active': editor}" @click="tabChange('editor')" class="nav-link">
          <font-awesome-icon icon="palette" />
        </a>
      </li>
    </ul>
    <div class="tab-content">
      <div :class="{'active': !editor}" class="tab-pane">
        <div class="flex" id="flex">
          <button
              v-for="(color, i) in Colors"
              type="button" class="btn btn-sm btn-secondary"
              :key="i"
              :style="{'background-image': `linear-gradient(to bottom right, ${color})`}"
              @click="set(color)"
          ></button>
          <button
              v-if="localGradient"
              type="button" class="btn btn-sm btn-secondary"
              :style="{'background-image': `linear-gradient(to bottom right, ${localGradient})`}"
              @click="set(localGradient)"
          ></button>

        </div>
        <div class="remove">
          <button type="button" class="btn btn-secondary" @click="remove">
            <font-awesome-icon icon="eraser" />
          </button>
        </div>
      </div>

      <div :class="{'active': editor}" class="tab-pane">
        <div class="grapick-cont">
          <div id="grapick"></div>
        </div>
        <div class="flex control">
          <button type="button" class="btn btn-sm btn-primary" @click="attach">
            <font-awesome-icon icon="paint-roller" />
          </button>
          <button type="button" class="btn btn-sm btn-secondary"  @click="remove">
            <font-awesome-icon icon="eraser" />
          </button>
          <button type="button" class="btn btn-sm btn-warning" @click="reset">
            <font-awesome-icon icon="trash" />
          </button>
          <button type="button" :class="{'btn-success': isChange}" class="btn btn-sm" @click="save">
            <font-awesome-icon icon="save" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Vue from "vue";
import Grapick from "grapick";
import "./lib/bootstrap.min.css";
import "./lib/grapick.min.css";
import "./styles.scss";

const Colors = [
  "#333333 0%, #B67B03 18%, #DAAF08 45%, #FEE9A0 70%, #DAAF08 85%, #B67B03 90%, #B67B03 98%, #ffffff 99%",
  "#333333 0%, #757575 18%, #9E9E9E 45%, #E8E8E8 70%, #9E9E9E 85%, #757575 90%, #757575 98%, #ffffff 99%",
  "#333333 0%, #ca7345 18%, #a14521 45%, #ffdeca 70%, #a14521 85%, #ca7345 90%, #ca7345 98%, #ffffff 99%",
  "#333333 0%, #44ca85 18%, #1a7043 45%, #7cf3ba 70%, #298946 85%, #31a070 90%, #31a070 98%, #ffffff 99%",

  "#333333 0%, #161532 18%, #6b6392 47%, #f78787 70%, #ffe4a8 92%, #ffffff 99%",
  "#333333 15%, #87094A 30%, #FF6773 50%, #FE839E 70%, #FCB89B 85%, #F8E0CA 96%, #ffffff 100%",
  "#333333 0%, #231557 19%, #44107A 29%, #ff5c92 67%, #ffb38a 91%, #fee3be 99%",
  "#333333 0%, #58200e 9%, #b45313 35%, #c96b2c 45%, #fea690 55%, #f78787 70%, #ffe4a8 92%, #ffffff 99%",

  "#333333 0%, #073155 18%, #368396 47%, #f78787 70%, #ffe4a8 92%, #ffffff 99%",
  "#333333 15%, #87094A 30%, #FF4A7A 50%, #FF7770 70%, #FFC484 85%, #F8E0CA 96%, #ffffff 100%",
  "#333333 8%, #3f2b88 27%, #FF4A7A 50%, #FF7770 70%, #FFC484 90%, #F8E0CA 99%",
  "#333333 0%, #763d3d 30%, #5eba97 62%, #ffffff 99%",

  "#333333 0%, #075433 18%, #369664 47%, #f78787 70%, #ffe4a8 92%, #ffffff 99%",
  "#007EA7 0%, #80CED7 98%, #ffffff 99%",
  "#ff2400 0%, #e81d1d 13%, #e8b71d 26%, #e3e81d 39%, #1de840 52%, #1ddde8 65%, #2b1de8 78%, #dd00f3 91%, #ffffff 100%",
];


export default Vue.extend({
  data: function() {
    return {
      gp: null,
      attached: false,
      editor: false,
      gradient: null,
      localGradient: null,
    }
  },
  mounted() {
    this.createGrapick();
  },
  beforeDestroy() {
  },
  computed: {
    Colors() {
      return Colors;
    },
    isChange() {
      return this.gradient !== this.localGradient;
    }
  },
  methods: {
    tabChange(name) {
      this.editor = (name === "editor");
    },
    createGrapick() {
      this.gp = new Grapick({
        el: '#grapick',
        direction: 'right',
        type: 'linear',
        min: 0,
        max: 100,
      });

      this.localGradient = localStorage.gradient;
      if (this.localGradient) {
        this.gradient = localStorage.gradient;
        this.gp.clear();
        const ary = this.localGradient.split(', ');
        for (let i = 0, l = ary.length; i < l; i++) {
          const str = ary[i].replace('%', '').split(' ');
          if (i !== l - 1) {
            this.gp.addHandler(parseInt(str[1]), str[0], 1);
          } else {
            this.gp.addHandler(parseInt(str[1]), str[0], 1, {keepSelect: 1});
          }
        }
      } else {
        this.resetGrapick();
      }

      this.gp.on('change', this.change);
      // this.gp.emit('change');
    },
    resetGrapick() {
      this.gp.off('change', this.change);
      this.gp.clear();
      this.gp.addHandler(0, '#000000', 1);
      this.gp.addHandler(100, '#ffffff', 1, {keepSelect: 1});
      this.gp.on('change', this.change);
      this.gradient = "#000000 0%, #ffffff 100%";
      this.gp.emit('change');
    },
    /**
     * cssグラデーション文字列を、グラデーション文字列に変換する
     * @param cssString
     * @returns {string} gradient
     * @private
     */
    _replaceCss(cssString) {
      let retStr = cssString;

      // rgbaが含まれていたらhexに変換する
      if (/rgba/.test(cssString)) {
        const pattern = 'rgba\\(\\d+, \\d+, \\d+, \\d+\\)';
        const regexp = new RegExp(pattern, "g");
        const result = cssString.match(regexp);

        if (result) {
          for (let i = 0, l = result.length; i < l; i++) {
            let rgb = result[i].replace(/rgba\((\d+), (\d+), (\d+), \d+\)/, 'rgb($1, $2, $3)');
            let hex = this._rgbToHex(rgb);
            retStr = retStr.replace(result[i], hex);
          }
        }
      }
      return retStr.replace('linear-gradient(to right, ', '').slice(0, -1);
    },
    /**
     * rgbをHEXに変換する
     * @param color
     * @returns {string}
     * @private
     */
    _rgbToHex(color) {
      let hex = '#';
      if (color.match(/^#[a-f\d]{3}$|^#[a-f\d]{6}$/i)) {
        return color;
      }
      const regex = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
      if (regex) {
        let rgb =
            [
              parseInt(regex[1]).toString(16),
              parseInt(regex[2]).toString(16),
              parseInt(regex[3]).toString(16)
            ];

        for (let i = 0; i < rgb.length; ++i) {
          if (rgb[i].length === 1) {
            rgb[i] = '0' + rgb[i];
          }
          hex += rgb[i];
        }
        return hex;
      }

      console.error('第1引数はRGB形式で入力');
      return '';
    },
    change(finish) {
      // console.info('finish', (finish));
      const value = this.gp.getValue();
      this.gradient = this._replaceCss(value);
      if (this.attached) {
        if (finish === 1 || finish === undefined) {
          console.info(this.gradient);
        }
        this.sendMessage({'gradient': this.addTransparent(this.gradient)});
      }
    },
    set(gradient) {
      this.attached = true;
      this.gp.off('change', this.change);
      this.gp.clear();
      const ary = gradient.split(', ');
      for (let i = 0, l = ary.length; i < l; i++) {
        const str = ary[i].replace('%', '').split(' ');
        if (i !== l - 1) {
          this.gp.addHandler(parseInt(str[1]), str[0], 1);
        } else {
          this.gp.addHandler(parseInt(str[1]), str[0], 1, {keepSelect: 1});
        }
      }
      this.gradient = gradient;
      this.gp.on('change', this.change);
      this.sendMessage({'gradient': this.addTransparent(gradient)});
    },
    addTransparent(gradient) {
      let ary = gradient.split(', ');
      const start = ary[0].split(' ');
      if (start.length > 1 && start[1] !== '0%') {
        ary.unshift('transparent 0%', `${start[0]} 0%`);
      } else {
        ary.unshift('transparent 0%');
      }

      return ary.join(', ');
    },
    attach() {
      this.attached = true;
      const value = this.gp.getValue();
      if (value) {
        this.sendMessage({'gradient': this.addTransparent(this._replaceCss(value))});
      }
    },
    remove() {
      this.sendMessage({'gradient': "remove"});
    },
    reset() {
      localStorage.removeItem('gradient');
      this.localGradient = null;
      this.resetGrapick();
    },
    save() {
      const value = this.gp.getValue();
      if (value) {
        localStorage.setItem('gradient', this._replaceCss(value));
        this.localGradient = this._replaceCss(value);
      }
    },
    sendMessage(msg) {
      // console.info('sendMessage', msg);
      if (chrome && chrome.tabs) {
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
          chrome.tabs.executeScript(tabs[0].id, {
            file: "/content/addGradientMaps.js"
          });
          chrome.tabs.executeScript(tabs[0].id, {
            file: "/content/content.js"
          });

          // 上２つを追加する前にsendMessageすると1回目が失敗するので、少し待つ
          setTimeout(() => {
            chrome.tabs.sendMessage(tabs[0].id, msg);
          }, 100);
        });
      }
    },
  },
});
</script>

<style lang="scss" scoped>
  .container {
    width: 201px;
    padding: 5px 0 0;
    background: #eee;
  }
  .flex {
    display: flex;
    margin: 0 -5px 0 0;
    flex-wrap: wrap;
  }
  .flex .btn {
    margin: 0 5px 5px 0;
    min-height: 31px;
    min-width: 41px;
  }
  .remove .btn {
    width: 100%;
  }
  .nav-tabs {
    padding: 0 5px;
  }
  .tab-pane {
    padding: 10px;
    background: #fff;
  }
  .grapick-cont {
    padding: 15px 3px 25px;
  }
  .control .btn-sm {
    padding-bottom: 7px;
  }
</style>
