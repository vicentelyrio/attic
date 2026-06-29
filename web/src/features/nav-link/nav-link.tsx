import { forwardRef } from 'react'
import { createLink, type LinkComponent } from '@tanstack/react-router'
import { NavLink as NavLinkComponent, type NavLinkProps } from '@mantine/core'

interface MantineNavLinkProps extends Omit<NavLinkProps, 'href'> {}

const MantineNavLink = forwardRef<HTMLAnchorElement, MantineNavLinkProps>(
  (props, ref) => <NavLinkComponent ref={ref} {...props} />,
)

const CreatedLink = createLink(MantineNavLink)

export const NavLink: LinkComponent<typeof MantineNavLink> = (props) => {
  return <CreatedLink preload="intent" {...props} />
}
