import React, { useRef, useState, useEffect } from "react";
import { Edit3, Eraser, Download } from "lucide-react";
import { DigitalCanvasStroke } from "../../../types";

export default function DigitalCanvas({ strokes }: { strokes: DigitalCanvasStroke[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#f43f5e");

  // A real implementation would sync paths in real time via sockets.
  // This is a minimal visual wrapper.

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Set internal resolution based on CSS size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Redraw existing strokes
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    strokes.forEach(stroke => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });
  }, [strokes]);

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
  };

  const endDraw = () => {
    setIsDrawing(false);
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-6 h-[600px]">
      <div className="flex items-center gap-3 w-full max-w-4xl">
        <div className="w-10 h-10 rounded-full bg-pink-950/40 flex items-center justify-center border border-pink-500/30">
          <Edit3 className="w-5 h-5 text-pink-500" />
        </div>
        <h3 className="text-xl font-serif text-white flex-1">Shared Canvas</h3>
        
        <div className="flex items-center gap-2 bg-black/60 border border-white/10 rounded-xl p-2">
          {['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#ffffff'].map(c => (
            <button 
              key={c}
              onClick={() => setColor(c)}
              className={`w-6 h-6 rounded-full border-2 transition ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
          <div className="w-px h-6 bg-white/10 mx-2" />
          <button className="text-white/50 hover:text-white p-1 transition cursor-pointer"><Eraser className="w-5 h-5" /></button>
          <button className="text-white/50 hover:text-white p-1 transition cursor-pointer"><Download className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="flex-1 w-full max-w-4xl bg-black/80 border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative cursor-crosshair">
        <canvas 
          ref={canvasRef}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseOut={endDraw}
          className="w-full h-full block"
        />
      </div>
    </div>
  );
}
