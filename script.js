const envelope = document.getElementById("envelope-container");
const envelopeImg = document.getElementById("envelope-img");
const lettersSection = document.getElementById("letters-section");
const photoGrid = document.getElementById("photo-grid");
const noBtn = document.querySelector(".no");

let hasScrolledToLetters = false;

let isOpen = false;
let isAnimating = false;
let tilesEnabled = false;

let clickedCount = 0;

// Moving No
noBtn.addEventListener("mouseover", () => {
    const min = 100;
    const max = 100;

    const dist = Math.random() * (max - min) + min;
    const ang = Math.random() * Math.PI * 2;

    const mX = Math.cos(ang) * dist;
    const mY = Math.sin(ang) * dist;

    noBtn.style.transition = "transform 0.3s ease";
    noBtn.style.transform = `translate(${mX}px, ${mY}px)`;
})

// YES
const yesBtn = document.querySelector(".yes");

function confettiBurst({
  pieces = 300,
  duration = 20000,
} = {}) {
  const start = performance.now();

  for (let i = 0; i < pieces; i++) {
    const el = document.createElement("div");
    el.className = "confetti-piece";

    // random horizontal start
    const x = Math.random() * window.innerWidth;

    // random size
    const w = 6 + Math.random() * 10;
    const h = 8 + Math.random() * 14;
    el.style.width = `${w}px`;
    el.style.height = `${h}px`;

    // random "confetti" colors
    el.style.background = `hsl(${Math.floor(Math.random() * 360)}, 90%, 60%)`;

    // random fall distance + drift
    const fall = window.innerHeight + 120 + Math.random() * 200;
    const drift = (Math.random() - 0.4) * 240; // left/right
    const spin = (Math.random() - 0.3) * 720;  // degrees

    // random delay so it feels like a shower
    const delay = Math.random() * 500;

    el.style.left = `${x}px`;

    document.body.appendChild(el);

    el.animate(
      [
        { transform: `translate(0px, 0px) rotate(0deg)`, opacity: 1 },
        { transform: `translate(${drift}px, ${fall}px) rotate(${spin}deg)`, opacity: 1 },
        { transform: `translate(${drift}px, ${fall + 80}px) rotate(${spin + 180}deg)`, opacity: 0 },
      ],
      {
        duration: duration + Math.random() * 200,
        delay,
        easing: "cubic-bezier(0.15, 0.8, 0.2, 1)",
        fill: "forwards",
      }
    );

    // cleanup
    setTimeout(() => el.remove(), duration + 500 + delay);
  }
}

if (yesBtn) {
  yesBtn.addEventListener("click", () => {
    confettiBurst({ pieces: 700, duration: 6000 });
  });
}


function enableTileClicks() {
  if (tilesEnabled) return;
  tilesEnabled = true;

  const tiles = Array.from(document.querySelectorAll("#photo-grid .tile"));
  const total = tiles.length;

  tiles.forEach((tile) => {
    tile.addEventListener("click", () => {
      if (tile.dataset.clicked === "true") return;
      console.log("clicked")
      tile.dataset.clicked = "true";
      clickedCount += 1;

      tile.classList.toggle("revealed");

      if (clickedCount === total) {
        const finalSection = document.getElementById("final-section");
        if (finalSection) {
            setTimeout(async () => {
            const targetY = window.scrollY + window.innerHeight * 1.1;
            await slowScrollTo(targetY, 2500); // change this number for speed
            }, 400);
        }
      }
    });
  });
}

function getCenterRect(el) {
  const r = el.getBoundingClientRect();
  return {
    x: r.left + r.width / 2,
    y: r.top + r.height / 2,
    width: r.width,
    height: r.height,
  };
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

async function dropStackIntoGrid() {
    const gridPhotos = Array.from(photoGrid.querySelectorAll(".photo"));

    const prevOpacity = photoGrid.style.opacity;
    const prevTransform = photoGrid.style.transform;
    const prevTransition = photoGrid.style.transition;

    photoGrid.style.transition = "none";
    photoGrid.style.opacity = "1";
    photoGrid.style.transform = "none";

    const targetRects = gridPhotos.map(img => img.getBoundingClientRect());

    // restore
    photoGrid.style.opacity = prevOpacity;
    photoGrid.style.transform = prevTransform;
    photoGrid.style.transition = prevTransition;

    // Spawn point = center of the envelope image (more realistic than container)
    const spawn = getCenterRect(envelopeImg);

    // Create floating clones at envelope position
    const clones = gridPhotos.map((img, i) => {
        const clone = img.cloneNode(true);
        clone.classList.add("falling-photo");

    // Start size roughly like target cell size (so it doesn't jump)
    const tr = targetRects[i];
    clone.style.width = `${tr.width}px`;
    clone.style.height = `${tr.height}px`;

    // Place the clone centered at the envelope
    clone.style.left = `${spawn.x - tr.width / 2}px`;
    clone.style.top = `${spawn.y - tr.height / 2}px`;

    document.body.appendChild(clone);
    return clone;
});

// Animate each clone falling & dispersing into its target slot
const animations = clones.map((clone, i) => {
    const startRect = clone.getBoundingClientRect();
    const endRect = targetRects[i];

    const dx = (endRect.left - startRect.left);
    const dy = (endRect.top - startRect.top);

    // Messy stack feel
    const startRot = rand(-20, 20);
    const midRot = rand(-15, 15);
    const endRot = rand(-10, 10);

    const finalRot = endRot;
    const finalX = rand(-6, 6);
    const finalY = rand(-6, 6);

    // apply the final "messy" look to the real grid image
    // gridPhotos[i].style.transform = `translate(${finalX}px, ${finalY}px) rotate(${finalRot}deg)`;
    const tile = gridPhotos[i].closest(".tile");
    tile.style.transform = `translate(${finalX}px, ${finalY}px) rotate(${finalRot}deg)`;

    const startXJitter = rand(-12, 12);
    const startYJitter = rand(-10, 10);

    // Overshoot a tiny bit then settle (like paper landing)
    const overshootY = rand(10, 22);
    const overshootX = rand(-10, 10);

    const delay = i * 90; // stagger
    const duration = 1100 + i * 150;

    return clone.animate(
    [
        {
            transform: `translate(${startXJitter}px, ${startYJitter}px) rotate(${startRot}deg) scale(0.9)`,
            offset: 0,
        },
        {
            transform: `translate(${dx + overshootX}px, ${dy + overshootY}px) rotate(${midRot}deg) scale(1.02)`,
            offset: 0.82,
        },
        {
            transform: `translate(${dx + finalX}px, ${dy + finalY}px) rotate(${finalRot}deg) scale(1)`,
            offset: 1,
        },
      ],
      {
        duration,
        delay,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)", // nice "drop" curve
        fill: "forwards",
        }
    );
  });

//   // Wait for the last animation to finish
//   await Promise.all(animations.map(a => a.finished));

//   // Clean up clones
//   clones.forEach(c => c.remove());

//   // Reveal the real grid
//   photoGrid.classList.add("reveal");

    // Wait for the last animation to finish
    await Promise.all(animations.map(a => a.finished));

    // 1) Reveal grid instantly (no fade) so there's no gap
    const prevTransition2 = photoGrid.style.transition;
    photoGrid.style.transition = "none";
    photoGrid.classList.add("reveal");

    // Force style flush so the browser applies it now
    photoGrid.getBoundingClientRect();

    // 2) Next frame, remove clones (so visuals are already there)
    await new Promise(requestAnimationFrame);
    clones.forEach(c => c.remove());

    // 3) Restore transition for any future reveals (optional)
    photoGrid.style.transition = prevTransition2;
}

function slowScrollTo(targetY, duration = 2000) {
  return new Promise((resolve) => {
    const startY = window.scrollY;
    const distance = targetY - startY;
    let startTime = null;

    function animation(currentTime) {
      if (!startTime) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);

      const ease = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      window.scrollTo(0, startY + distance * ease);

      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      } else {
        resolve();
      }
    }

    requestAnimationFrame(animation);
  });
}


// Starts scroll at top
if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
}

window.addEventListener("load", () => {
    window.scrollTo(0, 0);
});

envelope.addEventListener("click", async () => {
    if (isAnimating) return;
    isAnimating = true;

    envelopeImg.src = "src/pixel_art/e_o.png";

    const targetY = lettersSection.offsetTop;
    await slowScrollTo(targetY, 3000);

    // wait 1 frame so layout + scroll position are fully settled
    await new Promise(requestAnimationFrame);

    await dropStackIntoGrid();
    enableTileClicks();

    isAnimating = false;
});