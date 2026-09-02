import websyW from '../../assets/websy-w-white.png'

export function Logo({ size = 20, className = '' }: { size?: number; className?: string }) {
  return <img src={websyW} alt="Websy" style={{ height: size }} className={className} />
}
