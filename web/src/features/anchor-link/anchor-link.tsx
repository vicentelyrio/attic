import { Anchor, type AnchorProps } from '@mantine/core'
import { createLink, type LinkComponent } from '@tanstack/react-router'
import { forwardRef } from 'react'

interface MantineAnchorProps extends Omit<AnchorProps, 'href'> {}

const MantineAnchor = forwardRef<HTMLAnchorElement, MantineAnchorProps>(
  (props, ref) => <Anchor ref={ref} {...props} />,
)

const CreatedLink = createLink(MantineAnchor)

export const AnchorLink: LinkComponent<typeof MantineAnchor> = (props) => {
  return <CreatedLink preload="intent" {...props} />
}
