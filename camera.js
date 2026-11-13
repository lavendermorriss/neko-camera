/* 猫たん採寸カメラ - 撮影画面 (camera.html) の動き
 * 1. カメラ映像を出す
 * 2. ガイド画像（正面・横・真上）を重ねて切り替える
 * 3. ガイドのこさを変える
 * ※ 撮影ボタン・保存は次の段階（手順2）で追加する
 */
(function () {
  'use strict';

  // ガイド画像の定義（順番は 正面 → 横 → 真上）
  var GUIDES = {
    front: { label: '正面', src: 'img/guide_front.png' },
    side:  { label: '横',   src: 'img/guide_side.png' },
    top:   { label: '真上', src: 'img/guide_top.png' }
  };
  var ORDER = ['front', 'side', 'top'];

  var stage = document.getElementById('stage');
  var video = document.getElementById('video');
  var guideImg = document.getElementById('guide');
  var stepText = document.getElementById('stepText');
  var startPanel = document.getElementById('startPanel');
  var startBtn = document.getElementById('startBtn');
  var message = document.getElementById('message');
  var opacityInput = document.getElementById('opacity');
  var tabs = document.querySelectorAll('.tab');

  var stream = null;

  // ---------- ガイド切り替え ----------

  function showGuide(key) {
    var guide = GUIDES[key];
    if (!guide) { return; }

    guideImg.src = guide.src;
    guideImg.alt = guide.label + 'のガイド';

    var number = ORDER.indexOf(key) + 1;
    stepText.textContent = number + ' / ' + ORDER.length + '　' + guide.label;

    for (var i = 0; i < tabs.length; i++) {
      var selected = tabs[i].getAttribute('data-guide') === key;
      tabs[i].setAttribute('aria-selected', selected ? 'true' : 'false');
    }
  }

  for (var i = 0; i < tabs.length; i++) {
    tabs[i].addEventListener('click', function (event) {
      showGuide(event.currentTarget.getAttribute('data-guide'));
    });
  }

  // ---------- ガイドのこさ ----------

  function applyOpacity() {
    var value = Number(opacityInput.value) / 100;
    stage.style.setProperty('--guide-opacity', String(value));
  }

  opacityInput.addEventListener('input', applyOpacity);

  // ---------- メッセージ ----------

  function showMessage(text) {
    message.textContent = text;
    message.hidden = false;
  }

  function hideMessage() {
    message.textContent = '';
    message.hidden = true;
  }

  function messageForError(error) {
    var name = error && error.name ? error.name : '';

    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
      return 'カメラが許可されていません。Chromeのアドレスバー左の鍵マークをタップして、カメラを「許可」にしてから、もう一度「カメラをはじめる」を押してください。';
    }
    if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
      return 'カメラが見つかりません。カメラのある端末で開いてください。';
    }
    if (name === 'NotReadableError' || name === 'TrackStartError') {
      return 'カメラを他のアプリが使っています。他のアプリを閉じてから、もう一度「カメラをはじめる」を押してください。';
    }
    return 'カメラを起動できませんでした。もう一度「カメラをはじめる」を押してください。';
  }

  // ---------- カメラ ----------

  function startCamera() {
    hideMessage();

    if (!window.isSecureContext) {
      showMessage('カメラは https:// で始まるアドレスのページでしか使えません。ロリポップのhttpsのアドレスで開いてください。');
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showMessage('このブラウザではカメラが使えません。ChromeかSafariで開いてください。');
      return;
    }

    startBtn.disabled = true;

    navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false
    }).then(function (newStream) {
      stream = newStream;
      video.srcObject = newStream;
      return video.play();
    }).then(function () {
      stage.classList.add('is-live');
      startPanel.hidden = true;
    }).catch(function (error) {
      stopCamera();
      showMessage(messageForError(error));
      startBtn.disabled = false;
    });
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(function (track) { track.stop(); });
      stream = null;
    }
    video.srcObject = null;
    stage.classList.remove('is-live');
  }

  startBtn.addEventListener('click', startCamera);
  window.addEventListener('pagehide', stopCamera);

  // ---------- 最初の表示 ----------

  applyOpacity();
  showGuide('front');
})();
