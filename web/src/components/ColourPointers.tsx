// These pointers are copied from the react-color-wheel and react-color-shade-slider libraries.
// This is to allow for custom styling of the pointers.

import React from 'react'
import type { CSSProperties } from 'react'

export type ColourWheelPointerProps = {
  prefixCls?: string
  top?: string
  left: string
  color?: string
} & React.HTMLAttributes<HTMLDivElement>

export type ShadeSliderPointerProps = {
  prefixCls?: string
  left?: string
  top?: string
  fillProps?: React.HTMLAttributes<HTMLDivElement>
  color?: string
} & React.HTMLAttributes<HTMLDivElement>

export const CustomShadeSliderPointer = ({
  className,
  prefixCls,
  left,
  top,
  style,
  color,
  ...reset
}: ShadeSliderPointerProps) => {
  const styleWrapper: React.CSSProperties = {
    ...style,
    position: 'absolute',
    left,
    top,
  }
  const stylePointer = {
    width: 30,
    height: 30,
    boxShadow: 'var(--alpha-pointer-box-shadow)',
    borderRadius: '50%',
    border: '3px solid #fff',
    transform: left ? 'translate(-15px, -7px)' : 'translate(10px, -20px)',
    background: color,
  } as CSSProperties

  console.log(color)
  return (
    <div
      className={`${prefixCls}-pointer ${className ?? ''}`}
      style={styleWrapper}
      {...reset}
    >
      <div style={stylePointer} />
    </div>
  )
}

export const CustomColourWheelPointer = ({
  className,
  color,
  left,
  top,
  style,
}: ColourWheelPointerProps): React.ReactNode => {
  const styleWarp: React.CSSProperties = {
    ...style,
    position: 'absolute',
    top,
    left,
  }

  return (
    <div className={className} style={styleWarp}>
      <div
        style={{
          width: 30,
          height: 30,
          transform: 'translate(-15px, -15px)',
          borderRadius: '50%',
          backgroundColor: color,
          border: '3px solid #fff',
        }}
      />
    </div>
  )
}
