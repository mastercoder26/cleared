import type { ButtonHTMLAttributes } from 'react'
import './ui.css'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
}

export function Button({ variant = 'primary', className = '', ...rest }: Props) {
  return <button className={`btn btn--${variant} ${className}`} {...rest} />
}
