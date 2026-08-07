interface Props {
  profile: { avatar_url: string | null; avatar_emoji: string } | null | undefined;
  size?: number;
  className?: string;
}

export function Avatar({ profile, size = 32, className = "" }: Props) {
  if (profile?.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt=""
        width={size}
        height={size}
        className={`inline-block rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-neutral-100 ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.55, lineHeight: 1 }}
    >
      {profile?.avatar_emoji ?? "🙂"}
    </span>
  );
}
