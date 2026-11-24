let bgImage; // 儲存背景圖片 bg/3.png
let bgOffsetX = 0; // 背景水平捲動偏移量（左右各延伸一張後的位移）
let characterSprite; // 儲存角色一停止精靈圖
let walkSprite; // 儲存角色一走路精靈圖
let magicSprite; // 儲存角色一施法精靈圖
let magicEffectSprite; // 儲存角色一魔法特效精靈圖
let characterX; // 角色一目前畫面水平中心位置
let isWalking = false; // 角色一是否正在走路
let facingDirection = 1; // 角色一朝向（1 為右，-1 為左）
let isCasting = false; // 角色一是否正在施法
let magicStartFrame = 0; // 施法開始畫面計數
let magicDirection = 1; // 施法鎖定方向
let spaceIsDown = false; // 避免空白鍵重複觸發
let activeEffects = []; // 飛行中的魔法特效

// === 角色二相關變數（世界座標獨立，不跟隨角色一） ===
let enemyStopSprite; // 2/stop/stop.png（8 格）
let enemyWalkSprite; // 2/walk/walk.png（8 格）
let enemyActionSprite; // 2/action/action.png（12 格）
let enemyWorldX; // 角色二在世界場景中的水平位置（不隨角色一移動）
let enemyFacing = -1; // 角色二朝向（1 為右，-1 為左）
let isEnemyWalking = false; // 角色二是否正在走路
let isEnemyInAction = false; // 角色二是否處於戰鬥動作
let hasTriggeredEncounter = false; // 避免重複觸發同一題

// === 簡單英文選擇題變數 ===
let showEnglishQuiz = false; // 是否顯示英文選擇題
let englishQuestionText = ""; // 英文題目文字
let englishCorrectAnswer = ""; // 正確英文選項
let englishOptions = []; // 四個選項陣列
let optionButtons = []; // 選項按鈕座標
let quizFeedback = ""; // 作答提示
let quizResultColor = null; // 作答回饋文字顏色
let isShowingResult = false; // 是否正在顯示答對／答錯結果並準備離開
let resultCloseFrame = 0; // 預計自動關閉題目的畫面計數

// 簡單英文題庫（單字翻譯與基礎填空）
const englishQuestionBank = [
  {
    q: "「蘋果」的英文是？",
    answer: "Apple",
    distractors: ["Banana", "Orange", "Grape"]
  },
  {
    q: "「狗」的英文是？",
    answer: "Dog",
    distractors: ["Cat", "Bird", "Fish"]
  },
  {
    q: "「水」的英文是？",
    answer: "Water",
    distractors: ["Fire", "Milk", "Bread"]
  },
  {
    q: "「書」的英文是？",
    answer: "Book",
    distractors: ["Pen", "Desk", "Bag"]
  },
  {
    q: "「太陽」的英文是？",
    answer: "Sun",
    distractors: ["Moon", "Star", "Cloud"]
  },
  {
    q: "Good ____!（早安）",
    answer: "morning",
    distractors: ["night", "red", "apple"]
  },
  {
    q: "I ____ a student.（我是學生）",
    answer: "am",
    distractors: ["is", "are", "be"]
  },
  {
    q: "「紅色」的英文是？",
    answer: "Red",
    distractors: ["Blue", "Green", "Black"]
  },
  {
    q: "「鳥」的英文是？",
    answer: "Bird",
    distractors: ["Bear", "Lion", "Deer"]
  },
  {
    q: "Thank ____!（謝謝你）",
    answer: "you",
    distractors: ["me", "he", "it"]
  }
];

const frameCountInSprite = 10;
const frameWidth = 139.5;
const frameHeight = 196;
const walkFrameCount = 9;
const walkFrameWidth = 1246 / walkFrameCount;
const walkFrameHeight = 198;
const magicFrameCount = 4;
const magicFrameWidth = 1039 / magicFrameCount;
const magicFrameHeight = 146;
const effectFrameCount = 5;
const effectFrameWidth = 740 / effectFrameCount;
const effectFrameHeight = 19;
const framesPerStep = 8;

const enemyStopFrameCount = 8; // stop.png 為 8 格
const enemyWalkFrameCount = 8; // walk.png 為 8 格
const enemyActionFrameCount = 12; // action.png 為 12 格

function preload() {
  bgImage = loadImage("bg/3.png"); // 載入背景圖片 bg/3.png
  characterSprite = loadImage("1/stop/stop.png");
  walkSprite = loadImage("1/walk/walk.png");
  magicSprite = loadImage("1/magic/magic.png");
  magicEffectSprite = loadImage("1/magic_effect/magic_effect.png");

  enemyStopSprite = loadImage("2/stop/stop.png");
  enemyWalkSprite = loadImage("2/walk/walk.png");
  enemyActionSprite = loadImage("2/action/action.png");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);
  characterX = width * 0.25; // 角色一初始在左側
  enemyWorldX = width * 0.75; // 角色二初始世界位置在右側
  quizResultColor = color(220);
  frameRate(60);
}

function generateEnglishProblem() {
  const picked = random(englishQuestionBank);
  englishQuestionText = picked.q;
  englishCorrectAnswer = picked.answer;

  const combined = [picked.answer, ...picked.distractors.slice(0, 3)];
  englishOptions = shuffle(combined);
  isShowingResult = false;
  resultCloseFrame = 0;
  quizResultColor = color(220);
  quizFeedback = "請按鍵盤 1～4 或點擊選項作答";
  showEnglishQuiz = true;
}

function closeQuizAndReturn() {
  showEnglishQuiz = false;
  isShowingResult = false;
  isEnemyInAction = false;
  englishOptions = [];
  optionButtons = [];
  quizFeedback = "";

  const enemyScreenX = enemyWorldX + bgOffsetX;
  if (characterX <= enemyScreenX) {
    characterX = max(50, characterX - 80);
  } else {
    characterX = min(width - 50, characterX + 80);
  }
  hasTriggeredEncounter = false;
}

function submitChoice(choiceIndex) {
  if (!showEnglishQuiz || isShowingResult || choiceIndex < 0 || choiceIndex >= englishOptions.length) {
    return;
  }

  const selectedVal = englishOptions[choiceIndex];
  isShowingResult = true;
  resultCloseFrame = frameCount + 66; // 顯示約 1.1 秒後自動離開畫面

  if (selectedVal === englishCorrectAnswer) {
    quizFeedback = `⭕ 答對了！（${selectedVal}）即將返回畫面...`;
    quizResultColor = color(120, 245, 150);
  } else {
    quizFeedback = `❌ 答錯了！你選了「${selectedVal}」，正確答案是「${englishCorrectAnswer}」`;
    quizResultColor = color(255, 120, 120);
  }
}

function draw() {
  background("#87CEEB"); // 載入前或無背景圖時的底色

  if (showEnglishQuiz && isShowingResult && frameCount >= resultCloseFrame) {
    closeQuizAndReturn();
  }

  // 計算單張背景圖片依畫布高度等比例縮放後的寬度
  const bgAspect = bgImage && bgImage.height > 0 ? bgImage.width / bgImage.height : 1;
  const singleBgWidth = max(width, height * bgAspect);
  const singleBgHeight = height;

  // 左右各延伸一張（共 3 張：i = -1, 0, 1），限制捲動範圍不露出空白
  const minBgOffset = width - singleBgWidth * 2;
  const maxBgOffset = singleBgWidth;
  bgOffsetX = constrain(bgOffsetX, minBgOffset, maxBgOffset);

  const movementStep = constrain(width * 0.004, 2, 8);
  const characterScale = (height / 3) / frameHeight;
  const characterWidth = frameWidth * characterScale;
  const characterHeight = height / 3;

  // === 角色一移動（← / → 鍵）與延伸背景捲動 ===
  const movingRight = keyIsDown(RIGHT_ARROW);
  const movingLeft = keyIsDown(LEFT_ARROW);
  isWalking = movingRight || movingLeft;

  if (!showEnglishQuiz) {
    if (movingRight) {
      facingDirection = 1;
      if (characterX < width * 0.65 && bgOffsetX > minBgOffset) {
        characterX += movementStep;
      } else if (bgOffsetX > minBgOffset) {
        bgOffsetX = max(minBgOffset, bgOffsetX - movementStep);
      } else {
        characterX += movementStep;
      }
    } else if (movingLeft) {
      facingDirection = -1;
      if (characterX > width * 0.35 && bgOffsetX < maxBgOffset) {
        characterX -= movementStep;
      } else if (bgOffsetX < maxBgOffset) {
        bgOffsetX = min(maxBgOffset, bgOffsetX + movementStep);
      } else {
        characterX -= movementStep;
      }
    }
  }
  characterX = constrain(characterX, characterWidth / 2, width - characterWidth / 2);

  // 計算角色二單格基準寬度
  const refEnemyImg = (enemyStopSprite && enemyStopSprite.height > 0)
    ? enemyStopSprite
    : (enemyWalkSprite && enemyWalkSprite.height > 0 ? enemyWalkSprite : null);
  const refEnemyFrames = refEnemyImg === enemyWalkSprite ? enemyWalkFrameCount : enemyStopFrameCount;
  const enemyRefW = refEnemyImg ? refEnemyImg.width / refEnemyFrames : frameWidth;
  const enemyRefH = refEnemyImg ? refEnemyImg.height : frameHeight;
  const enemyBaseScale = (height / 3) / enemyRefH;
  const enemyDisplayWidth = enemyRefW * enemyBaseScale;

  // === 角色二獨立移動（僅受 A (65) 與 D (68) 鍵控制，不跟隨角色一） ===
  const enemyMovingLeft = keyIsDown(65); // A
  const enemyMovingRight = keyIsDown(68); // D
  isEnemyWalking = !isEnemyInAction && (enemyMovingLeft || enemyMovingRight);

  if (!isEnemyInAction && !showEnglishQuiz) {
    if (enemyMovingRight) {
      enemyFacing = 1;
      enemyWorldX += movementStep;
    } else if (enemyMovingLeft) {
      enemyFacing = -1;
      enemyWorldX -= movementStep;
    }
  }

  const minEnemyWorldX = -singleBgWidth + enemyDisplayWidth / 2;
  const maxEnemyWorldX = singleBgWidth * 2 - enemyDisplayWidth / 2;
  enemyWorldX = constrain(enemyWorldX, minEnemyWorldX, maxEnemyWorldX);

  const enemyScreenX = enemyWorldX + bgOffsetX;

  // === 碰撞偵測：角色一與角色二觸碰 ===
  const hitDistance = (characterWidth * 0.45) + (enemyDisplayWidth * 0.45);
  const isTouching = abs(characterX - enemyScreenX) <= hitDistance;

  if (isTouching && !hasTriggeredEncounter) {
    hasTriggeredEncounter = true;
    isEnemyInAction = true;
    isEnemyWalking = false;
    generateEnglishProblem();
  } else if (!isTouching && !showEnglishQuiz) {
    hasTriggeredEncounter = false;
  }

  // === 繪製背景（左右各延伸一張，共 3 張並排） ===
  if (bgImage && bgImage.width > 0 && bgImage.height > 0) {
    push();
    imageMode(CORNER);
    for (let i = -1; i <= 1; i++) {
      const drawX = bgOffsetX + i * singleBgWidth;
      image(bgImage, drawX, 0, singleBgWidth, singleBgHeight);
    }
    pop();
  }

  // === 繪製角色一 ===
  if (isCasting && frameCount - magicStartFrame >= magicFrameCount * framesPerStep) {
    isCasting = false;
    activeEffects.push({
      x: characterX + magicDirection * characterWidth / 2,
      y: height - characterHeight * 0.58,
      direction: magicDirection
    });
  }

  const activeSprite = isCasting ? magicSprite : isWalking ? walkSprite : characterSprite;
  const activeFrameCount = isCasting ? magicFrameCount : isWalking ? walkFrameCount : frameCountInSprite;
  const activeFrameWidth = isCasting ? magicFrameWidth : isWalking ? walkFrameWidth : frameWidth;
  const activeFrameHeight = isCasting ? magicFrameHeight : isWalking ? walkFrameHeight : frameHeight;
  const elapsedMagicFrames = frameCount - magicStartFrame;
  const frameIndex = isCasting
    ? floor(elapsedMagicFrames / framesPerStep)
    : floor(frameCount / framesPerStep) % activeFrameCount;
  const sourceX = frameIndex * activeFrameWidth;
  const activeWidth = activeFrameWidth * characterScale;
  const activeHeight = activeFrameHeight * characterScale;
  const characterY = height - activeHeight / 2;

  push();
  translate(characterX, characterY);
  scale(isCasting ? magicDirection : facingDirection, 1);
  image(activeSprite, 0, 0, activeWidth, activeHeight, sourceX, 0, activeFrameWidth, activeFrameHeight);
  pop();

  // === 繪製角色二（單格裁切，每次只顯示一個角色） ===
  let currentEnemySprite = enemyStopSprite;
  let currentEnemyFrames = enemyStopFrameCount;

  if (isEnemyInAction && enemyActionSprite && enemyActionSprite.width > 0) {
    currentEnemySprite = enemyActionSprite;
    currentEnemyFrames = enemyActionFrameCount;
  } else if (isEnemyWalking && enemyWalkSprite && enemyWalkSprite.width > 0) {
    currentEnemySprite = enemyWalkSprite;
    currentEnemyFrames = enemyWalkFrameCount;
  }

  if (currentEnemySprite && currentEnemySprite.width > 0 && currentEnemySprite.height > 0) {
    const eSrcW = currentEnemySprite.width / currentEnemyFrames;
    const eSrcH = currentEnemySprite.height;
    const eScale = (height / 3) / eSrcH;
    const eIdx = floor(frameCount / framesPerStep) % currentEnemyFrames;
    const eSrcX = eIdx * eSrcW;
    const eDrawW = eSrcW * eScale;
    const eDrawH = eSrcH * eScale;
    const eDrawY = height - eDrawH / 2;

    push();
    translate(enemyScreenX, eDrawY);
    scale(enemyFacing, 1);
    image(currentEnemySprite, 0, 0, eDrawW, eDrawH, eSrcX, 0, eSrcW, eSrcH);
    pop();
  }

  // === 繪製魔法特效 ===
  const effectScale = characterScale;
  const effectWidth = effectFrameWidth * effectScale;
  const effectHeight = effectFrameHeight * effectScale;
  const effectSpeed = max(6, width * 0.008);
  for (let effectIndex = activeEffects.length - 1; effectIndex >= 0; effectIndex--) {
    const effect = activeEffects[effectIndex];
    effect.x += effect.direction * effectSpeed;
    if (effect.x > width || effect.x < 0) {
      activeEffects.splice(effectIndex, 1);
      continue;
    }
    const effectFrameIndex = floor(frameCount / framesPerStep) % effectFrameCount;
    push();
    translate(effect.x, effect.y);
    scale(effect.direction, 1);
    image(magicEffectSprite, 0, 0, effectWidth, effectHeight, effectFrameIndex * effectFrameWidth, 0, effectFrameWidth, effectFrameHeight);
    pop();
  }

  drawHudAndQuiz();
}

function drawHudAndQuiz() {
  push();
  imageMode(CORNER);
  fill(0, 0, 0, 140);
  noStroke();
  rect(16, 16, 330, 66, 8);

  fill(255);
  textSize(15);
  textAlign(LEFT, TOP);
  text("角色 1：← / → 移動、空白鍵施法", 28, 25);
  text("角色 2：A / D 移動、觸碰觸發英文選擇題", 28, 50);

  optionButtons = [];

  if (showEnglishQuiz) {
    const boxW = min(560, width * 0.9);
    const boxH = 265;
    const boxX = (width - boxW) / 2;
    const boxY = height * 0.13;

    fill(20, 28, 45, 240);
    stroke(255, 200, 80);
    strokeWeight(2);
    rect(boxX, boxY, boxW, boxH, 12);

    noStroke();
    fill(255, 215, 90);
    textSize(20);
    textAlign(CENTER, TOP);
    text("🔤 簡單英文選擇題", width / 2, boxY + 16);

    fill(255);
    textSize(26);
    text(englishQuestionText, width / 2, boxY + 52);

    const gapX = 16;
    const gapY = 12;
    const btnW = (boxW - 64 - gapX) / 2;
    const btnH = 44;
    const startX = boxX + 32;
    const startY = boxY + 98;

    for (let i = 0; i < englishOptions.length; i++) {
      const col = i % 2;
      const row = floor(i / 2);
      const bx = startX + col * (btnW + gapX);
      const by = startY + row * (btnH + gapY);

      const isHovered = !isShowingResult && mouseX >= bx && mouseX <= bx + btnW && mouseY >= by && mouseY <= by + btnH;

      fill(isHovered ? color(70, 130, 210) : color(45, 62, 95));
      stroke(isHovered ? color(255, 230, 120) : color(130, 160, 210));
      strokeWeight(1.5);
      rect(bx, by, btnW, btnH, 8);

      noStroke();
      fill(255);
      textSize(20);
      textAlign(CENTER, CENTER);
      text(`${i + 1}.  ${englishOptions[i]}`, bx + btnW / 2, by + btnH / 2);

      optionButtons.push({ index: i, x: bx, y: by, w: btnW, h: btnH });
    }

    fill(quizResultColor || color(220));
    textSize(16);
    textAlign(CENTER, TOP);
    text(quizFeedback, width / 2, boxY + 216);
  }
  pop();
}

function mousePressed() {
  if (!showEnglishQuiz || isShowingResult) return;
  for (const btn of optionButtons) {
    if (mouseX >= btn.x && mouseX <= btn.x + btn.w && mouseY >= btn.y && mouseY <= btn.y + btn.h) {
      submitChoice(btn.index);
      break;
    }
  }
}

function keyPressed() {
  if (showEnglishQuiz) {
    if (!isShowingResult) {
      if (key === "1") { submitChoice(0); return false; }
      if (key === "2") { submitChoice(1); return false; }
      if (key === "3") { submitChoice(2); return false; }
      if (key === "4") { submitChoice(3); return false; }
    }
    return false;
  }

  if (keyCode === RIGHT_ARROW) {
    isWalking = true;
    facingDirection = 1;
    return false;
  }
  if (keyCode === LEFT_ARROW) {
    isWalking = true;
    facingDirection = -1;
    return false;
  }
  if (keyCode === 32) {
    if (!spaceIsDown && !isCasting) {
      isCasting = true;
      magicStartFrame = frameCount;
      magicDirection = facingDirection;
    }
    spaceIsDown = true;
    return false;
  }
}

function keyReleased() {
  if (keyCode === 32) {
    spaceIsDown = false;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  characterX = constrain(characterX, 1, width - 1);
  enemyWorldX = constrain(enemyWorldX, 1, width - 1);
}