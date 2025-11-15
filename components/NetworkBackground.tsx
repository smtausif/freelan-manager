"use client";

import { useRef, useEffect } from "react";

export default function NetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const particles: { x: number; y: number; vx: number; vy: number }[] = [];
    const maxParticles = 120;
    const linkDistance = 150;

    // mouse position (start at center so background is centered initially)
    const mouse = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    };

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    // init particles
    for (let i = 0; i < maxParticles; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
      });
    }

    const draw = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      ctx.clearRect(0, 0, width, height);

      // 💡 strong, instant parallax with cursor
      const intensity = 0.1; // increase to 0.15 if you want it even faster
      const offsetX = (mouse.x - width / 2) * intensity;
      const offsetY = (mouse.y - height / 2) * intensity;

      ctx.save();
      ctx.translate(offsetX, offsetY);

      // base background
      ctx.fillStyle = "#020617";
      ctx.fillRect(-offsetX, -offsetY, width, height);

      // stars
      ctx.fillStyle = "rgba(148,163,184,0.25)";
      for (let i = 0; i < 60; i++) {
        const sx = (i * 97) % width;
        const sy = (i * 53) % height;
        ctx.beginPath();
        ctx.arc(sx, sy, 1.1, 0, Math.PI * 2);
        ctx.fill();
      }

      // update + draw particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        // soft wrap-around instead of bounce so it flows continuously
        if (p.x < -50) p.x = width + 50;
        if (p.x > width + 50) p.x = -50;
        if (p.y < -50) p.y = height + 50;
        if (p.y > height + 50) p.y = -50;

        // node
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(226,232,240,0.9)";
        ctx.fill();
      });

      // connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < linkDistance) {
            const alpha = 1 - dist / linkDistance;
            ctx.strokeStyle = `rgba(148,163,184,${alpha * 0.9})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(draw);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      // no smoothing, no delay → updates immediately
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 -z-10"
    />
  );
}
