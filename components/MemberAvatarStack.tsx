import Image from "next/image";

/** Public folder: `/members/person1.webp` … `person7.webp` */
export const MEMBER_AVATAR_PATHS = [1, 2, 3, 4, 5, 6, 7].map((n) => `/members/person${n}.webp` as const);

type MemberAvatarStackProps = {
  size?: number;
  className?: string;
};

export function MemberAvatarStack({ size = 36, className = "" }: MemberAvatarStackProps) {
  return (
    <div className={`flex items-center ${className}`} aria-hidden>
      {MEMBER_AVATAR_PATHS.map((src, i) => (
        <div
          key={src}
          className="relative rounded-full border-2 border-background bg-surface-container overflow-hidden shadow-md"
          style={{
            width: size,
            height: size,
            marginLeft: i === 0 ? 0 : -Math.round(size * 0.28),
            zIndex: MEMBER_AVATAR_PATHS.length - i,
          }}
        >
          <Image src={src} alt="" fill className="object-cover" sizes={`${size}px`} />
        </div>
      ))}
    </div>
  );
}
