// Adapted from sherryuser/cake-blow/script.js with additions for smoke, messages, and fireworks
document.addEventListener("DOMContentLoaded", function () {
  console.log('cake-blow.js initialized');
  const cake = document.querySelector(".cake-blow");
  const candleCountDisplay = document.getElementById("candleCount");
  const messageOverlay = document.getElementById("messageOverlay");
  let candles = [];
  let audioContext;
  let analyser;
  let microphone;
  let cakeBlewOut = false;
  let smokeParticles = [];
  let bubbleParticles = [];
  let fireworksParticles = [];
  let canvasForParticles = null;
  let ctx = null;
  let canvasDpr = 1;

  // ENHANCED Smoke particle system - visible light grey smoke
  class SmokeParticle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.vx = (Math.random() - 0.5) * 1.2;
      this.vy = -Math.random() * 1.5 - 1.0; // rise upward faster
      this.life = 1;
      this.decay = Math.random() * 0.008 + 0.005; // longer lasting
      this.radius = Math.random() * 8 + 4; // bigger particles (4-12px)
      this.maxRadius = this.radius;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life -= this.decay;
      this.vy -= 0.12; // rise upward stronger
      this.vx *= 0.96; // slight friction
      this.radius = this.maxRadius * (0.3 + this.life * 0.7); // expand as it fades
    }
    draw(ctx) {
      // Light grey smoke with strong glow
      const greyValue = 180 + Math.random() * 50; // 180-230 grey
      ctx.fillStyle = `rgba(${greyValue}, ${greyValue}, ${greyValue}, ${this.life * 0.6})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ENHANCED Bubble particle system - LARGE, VISIBLE, GLOWING
  class BubbleParticle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.vx = (Math.random() - 0.5) * 3;
      this.vy = -Math.random() * 4 - 3; // move upward FAST
      this.life = 1;
      this.decay = Math.random() * 0.008 + 0.005; // longer lasting
      this.radius = Math.random() * 20 + 15; // MUCH BIGGER (15-35px)
      this.colors = ['#ff0066', '#ff3300', '#00ffff', '#ffff00', '#00ff00', '#ff00ff', '#ff6600'];
      this.color = this.colors[Math.floor(Math.random() * this.colors.length)];
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life -= this.decay;
      this.vy -= 0.15; // float upward stronger
      this.vx *= 0.95;
    }
    draw(ctx) {
      if (this.life <= 0) return;
      
      // Simple, bulletproof drawing
      ctx.save();
      
      // Glow effect
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 20;
      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.life * 0.7;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      
      // White border
      ctx.globalAlpha = this.life;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Shine
      ctx.globalAlpha = this.life * 0.6;
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(this.x - this.radius / 3, this.y - this.radius / 3, this.radius / 3, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    }
  }

  // Fireworks particle system
  class FireworksParticle {
    constructor(x, y) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 2;
      this.x = x;
      this.y = y;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.life = 1;
      this.decay = Math.random() * 0.02 + 0.015;
      this.radius = Math.random() * 2 + 1;
      this.hue = Math.random() * 60 + 300; // anime colors (purple, pink)
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += 0.1; // gravity
      this.vx *= 0.98; // air resistance
      this.life -= this.decay;
    }
    draw(ctx) {
      ctx.fillStyle = `hsla(${this.hue}, 100%, 60%, ${this.life * 0.8})`;
      ctx.shadowColor = `hsl(${this.hue}, 100%, 50%)`;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function updateCandleCount() {
    const activeCandles = candles.filter((c) => !c.classList.contains("out")).length;
    if (candleCountDisplay) candleCountDisplay.textContent = activeCandles;
  }

  function addCandle(left, top) {
    if (candles.length >= 18) return; // Limit to 18 candles
    const candle = document.createElement("div");
    candle.className = "candle";
    candle.style.left = left + "px";
    candle.style.top = top + "px";

    const flame = document.createElement("div");
    flame.className = "flame";
    candle.appendChild(flame);

    cake.appendChild(candle);
    candles.push(candle);
    updateCandleCount();
  }

  cake && cake.addEventListener("click", function (event) {
    const rect = cake.getBoundingClientRect();
    const left = event.clientX - rect.left;
    const top = event.clientY - rect.top;
    addCandle(left, top);
  });

  function isBlowing() {
    if (!analyser) return false;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
    let average = sum / bufferLength;
    return average > 40;
  }

  function blowOutCandles() {
    let blownOut = 0;
    if (isBlowing()) {
      candles.forEach((candle) => {
        if (!candle.classList.contains("out") && Math.random() > 0.5) {
          candle.classList.add("out");
          blownOut++;
          // Create smoke and bubble effects from this candle's wick (viewport coordinates)
          const rect = candle.getBoundingClientRect();
          // Use viewport coordinates so the full-screen canvas matches particle positions
          const x = rect.left + rect.width / 2;
          const y = rect.top + 4; // slightly above the wick
          // Spawn light grey smoke - 20 particles per candle
          for (let i = 0; i < 20; i++) {
            smokeParticles.push(new SmokeParticle(x, y));
          }
          // Spawn visible bubbles that rise/fade - 12 bubbles per candle
          for (let i = 0; i < 12; i++) {
            // add small random horizontal offset so bubbles spread out from the wick
            const spreadX = x + (Math.random() - 0.5) * rect.width * 0.6;
            const spreadY = y + (Math.random() - 0.5) * 6;
            bubbleParticles.push(new BubbleParticle(spreadX, spreadY));
          }
        }
      });
    }
    if (blownOut > 0) {
      console.log("💨 Smoke spawned! Total smoke particles:", smokeParticles.length);
      updateCandleCount();
      // Check if all candles are blown
      if (candles.every(c => c.classList.contains("out")) && candles.length > 0 && !cakeBlewOut) {
        cakeBlewOut = true;
        showBlowMessage();
      }
    }
  }

  function spawnBackgroundFirecrackers() {
    // Spawn firecrackers randomly across screen
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const x = Math.random() * window.innerWidth * 0.8 + window.innerWidth * 0.1;
        const y = Math.random() * window.innerHeight * 0.6;
        for (let j = 0; j < 25; j++) {
          fireworksParticles.push(new FireworksParticle(x, y));
        }
      }, i * 300);
    }
  }

  function showBlowMessage() {
    messageOverlay.innerHTML = '<div class="blown-message">You have blown the cake!!! 🎂</div>';
    spawnBackgroundFirecrackers(); // Start background firecrackers
    setTimeout(() => {
      messageOverlay.innerHTML += '<div class="birthday-message">HAPPY BIRTHDAY DIII 🔥🔥🔥🧯🧯💨💨💨</div>';
      // Enable fireworks after messages appear
      document.addEventListener("click", spawnFireworks);
    }, 1200);
  }

  function spawnFireworks(event) {
    if (!cakeBlewOut) return;
    const x = event.clientX;
    const y = event.clientY;
    for (let i = 0; i < 30; i++) {
      fireworksParticles.push(new FireworksParticle(x, y));
    }
  }

  // Setup canvas for particle rendering
  function setupParticleCanvas() {
    canvasForParticles = document.getElementById("confetti");
    if (!canvasForParticles) {
      console.error("Canvas with id 'confetti' not found!");
      return;
    }
    // Support high-DPI displays for crisp particles
    canvasDpr = window.devicePixelRatio || 1;
    canvasForParticles.style.width = window.innerWidth + 'px';
    canvasForParticles.style.height = window.innerHeight + 'px';
    canvasForParticles.width = Math.floor(window.innerWidth * canvasDpr);
    canvasForParticles.height = Math.floor(window.innerHeight * canvasDpr);
    ctx = canvasForParticles.getContext("2d");
    // Normalize drawing operations to CSS pixels
    ctx.setTransform(canvasDpr, 0, 0, canvasDpr, 0, 0);
    console.log("Canvas setup complete. CSS size:", window.innerWidth, "x", window.innerHeight, " DPR:", canvasDpr);
  }

  setupParticleCanvas();

  // Keep canvas sized to viewport on resize
  window.addEventListener('resize', function() {
    if (canvasForParticles) {
      // Recompute DPR-aware sizes and reset transform
      canvasDpr = window.devicePixelRatio || 1;
      canvasForParticles.style.width = window.innerWidth + 'px';
      canvasForParticles.style.height = window.innerHeight + 'px';
      canvasForParticles.width = Math.floor(window.innerWidth * canvasDpr);
      canvasForParticles.height = Math.floor(window.innerHeight * canvasDpr);
      ctx = canvasForParticles.getContext('2d');
      ctx.setTransform(canvasDpr, 0, 0, canvasDpr, 0, 0);
      console.log('Resized confetti canvas to (CSS):', window.innerWidth, window.innerHeight, ' DPR:', canvasDpr);
    }
  });

  // Manual test helper: press 'B' to spawn visible bubbles at cake center
  function spawnTestBubbles() {
    if (!cake) return;
    const rect = cake.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 3;
    console.log('Spawning test bubbles at', cx, cy);
    for (let c = 0; c < 30; c++) {
      bubbleParticles.push(new BubbleParticle(cx + (Math.random()-0.5)*80, cy + (Math.random()-0.5)*30));
    }
  }

  // Manual blow fallback for touch devices: randomly extinguish some candles and spawn particles
  function manualBlow() {
    let blownOut = 0;
    candles.forEach((candle) => {
      if (!candle.classList.contains('out') && Math.random() > 0.4) {
        candle.classList.add('out');
        blownOut++;
        const rect = candle.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + 4;
        for (let i = 0; i < 12; i++) smokeParticles.push(new SmokeParticle(x, y));
        for (let i = 0; i < 6; i++) bubbleParticles.push(new BubbleParticle(x + (Math.random()-0.5)*rect.width*0.6, y + (Math.random()-0.5)*6));
      }
    });
    if (blownOut > 0) {
      updateCandleCount();
      if (candles.every(c => c.classList.contains('out')) && candles.length > 0 && !cakeBlewOut) {
        cakeBlewOut = true;
        showBlowMessage();
      }
    }
  }

  window.addEventListener('keydown', function(e) {
    if (e.key === 'b' || e.key === 'B') {
      spawnTestBubbles();
    }
  });

  // Touch support: tap to add a candle, long-press to simulate blowing
  let lastTouchStart = 0;
  let touchTimer = null;
  if (cake) {
    cake.addEventListener('touchstart', function(e) {
      lastTouchStart = Date.now();
      // start long-press timer
      touchTimer = setTimeout(function() {
        manualBlow();
      }, 600);
    }, { passive: true });

    cake.addEventListener('touchend', function(e) {
      const duration = Date.now() - lastTouchStart;
      if (touchTimer) { clearTimeout(touchTimer); touchTimer = null; }
      // treat short taps as add-candle
      if (duration < 300) {
        const rect = cake.getBoundingClientRect();
        const touch = e.changedTouches[0];
        const left = touch.clientX - rect.left;
        const top = touch.clientY - rect.top;
        addCandle(left, top);
      }
      e.preventDefault();
    }, { passive: false });
  }

  // Animation loop for particles (using existing confetti canvas)
  function animateParticles() {
    if (!ctx) {
      console.error("ctx is null");
      return;
    }
    
    // Clear canvas each frame
    // canvasForParticles.width/height are device pixels; scale transform normalizes drawing
    try {
      ctx.clearRect(0, 0, canvasForParticles.width / canvasDpr, canvasForParticles.height / canvasDpr);
    } catch (err) {
      // fallback: clear full device-pixel canvas
      ctx.setTransform(1,0,0,1,0,0);
      ctx.clearRect(0,0,canvasForParticles.width, canvasForParticles.height);
      ctx.setTransform(canvasDpr,0,0,canvasDpr,0,0);
    }
    
    // Debug: show bubble count occasionally
    if (bubbleParticles.length > 0 && Math.random() < 0.02) {
      console.log("🫧 Drawing", bubbleParticles.length, "bubbles at canvas", canvasForParticles.width, "x", canvasForParticles.height);
    }
    
    // Update and draw bubbles
    for (let i = bubbleParticles.length - 1; i >= 0; i--) {
      const particle = bubbleParticles[i];
      particle.update();
      particle.draw(ctx);
      if (particle.life <= 0) {
        bubbleParticles.splice(i, 1);
      }
    }
    
    // Update and draw smoke
    for (let i = smokeParticles.length - 1; i >= 0; i--) {
      const particle = smokeParticles[i];
      particle.update();
      particle.draw(ctx);
      if (particle.life <= 0) {
        smokeParticles.splice(i, 1);
      }
    }
    
    // Update and draw fireworks
    for (let i = fireworksParticles.length - 1; i >= 0; i--) {
      const particle = fireworksParticles[i];
      particle.update();
      particle.draw(ctx);
      if (particle.life <= 0) {
        fireworksParticles.splice(i, 1);
      }
    }

    requestAnimationFrame(animateParticles);
  }

  animateParticles();

  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(function (stream) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        analyser.fftSize = 256;
        setInterval(blowOutCandles, 200);
      })
      .catch(function (err) {
        console.log("Unable to access microphone: " + err);
      });
  } else {
    console.log("getUserMedia not supported on your browser!");
  }
});
