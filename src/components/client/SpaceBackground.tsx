/* src/components/client/SpaceBackground.tsx */
import { useMemo } from 'react';

interface StarLayerProps {
  count: number;
  size: number;
  duration: string;
  opacity: number;
}

const StarLayer = ({ count, size, duration, opacity }: StarLayerProps) => {
  // 많은 별을 하나하나 DOM으로 그리면 성능이 저하되므로, 
  // 단일 div의 box-shadow 속성에 수백 개의 좌표를 찍어 한 번에 렌더링합니다.
  const starsShadow = useMemo(() => {
    let shadow = "";
    for (let i = 0; i < count; i++) {
        // 화면 밖까지 커버하도록 2500px 범위 설정
        const x = Math.floor(Math.random() * 2500);
        const y = Math.floor(Math.random() * 2500);
        // 무작위 밝기 조절
        const alpha = (Math.random() * 0.5 + 0.5).toFixed(2);
        shadow += `${x}px ${y}px rgba(255, 255, 255, ${alpha})${i !== count - 1 ? ',' : ''}`;
    }
    return shadow;
  }, [count]);

  return (
    <div 
        className="absolute inset-0 animate-drift pointer-events-none"
        style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: '50%',
            boxShadow: starsShadow,
            opacity: opacity,
            animationDuration: duration,
            // 2500px 크기의 그림자를 무한 루프처럼 보이게 하기 위해 배경 복제 느낌
            transform: 'translateZ(0)' 
        } as any}
    />
  );
};

const SpaceBackground = () => {
  return (
    <div className="fixed inset-0 bg-[#020617] overflow-hidden pointer-events-none z-0">
      {/* 1. Milky Way Nebula (은하수 구름 효과) */}
      <div className="absolute inset-0 opacity-40 animate-nebula">
         {/* 보라색/남색 메인 성운 스트립 */}
         <div className="absolute top-[-20%] left-[-10%] w-[140%] h-[160%] rotate-[-25deg] 
            bg-[radial-gradient(ellipse_at_center,_rgba(139,92,246,0.25)_0%,_rgba(59,130,246,0.15)_35%,_transparent_75%)] blur-[120px]" />
         
         {/* 핑크색 하이라이트 성운 */}
         <div className="absolute bottom-[-10%] right-[-10%] w-[100%] h-[120%] rotate-[15deg] 
            bg-[radial-gradient(ellipse_at_center,_rgba(236,72,153,0.15)_0%,_rgba(139,92,246,0.08)_45%,_transparent_85%)] blur-[150px]" />
            
         {/* 은하수 중심부 밝은 띠 */}
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[400px] rotate-[-25deg]
            bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.05)_0%,_transparent_70%)] blur-[100px] opacity-50" />
      </div>

      {/* 2. Parallax Star Layers (다층 별무리) */}
      {/* 먼 배경: 아주 작은 별들 */}
      <StarLayer count={400} size={1} duration="240s" opacity={0.6} />
      
      {/* 중간 배경: 약간 더 큰 별들 */}
      <StarLayer count={200} size={1.5} duration="180s" opacity={0.4} />
      
      {/* 앞 배경: 반짝이는 큰 별들 */}
      <StarLayer count={80} size={2.5} duration="120s" opacity={0.3} />

      {/* 3. Twinkling Stars (반짝이는 독립된 별들) */}
      {[...Array(15)].map((_, i) => (
        <div 
          key={i}
          className="absolute w-[3px] h-[3px] bg-white rounded-full animate-twinkle opacity-60 filter blur-[0.5px]"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${2 + Math.random() * 3}s`
          }}
        />
      ))}

      {/* 4. Bottom Shadow Gradient (가독성을 위한 하단 어두운 처리) */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#020617]" />
    </div>
  );
};

export default SpaceBackground;
