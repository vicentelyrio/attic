import type { MouseEvent } from 'react'

import { useI18nContext } from '@i18n'
import { useNavigate } from '@tanstack/react-router'

import { CloseButton, Stack, Text } from '@mantine/core'

import { type Favorite, useFavorites } from '@domain'

import { NavLink, useDroppableFolder, useHoverNavigate } from '@features'

import classes from './favorites.module.css'

function FavoriteItem({
  favorite,
  onRemove,
}: {
  favorite: Favorite
  onRemove: (id: string) => void
}) {
  const { LL } = useI18nContext()
  const navigate = useNavigate()
  const drop = useDroppableFolder({
    scope: 'favorite',
    root: favorite.root,
    dir: favorite.path,
  })

  const { blinking } = useHoverNavigate(drop.dropActive, () => {
    navigate({
      to: '/$root/$',
      params: { root: favorite.root, _splat: favorite.path },
    })
  })

  const remove = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    onRemove(favorite.id)
  }

  return (
    <div
      ref={drop.setNodeRef}
      className={classes.dropTarget}
      data-drop-active={drop.dropActive || undefined}
      data-drop-invalid={drop.dropInvalid || undefined}
      data-drop-blink={blinking || undefined}
    >
      <NavLink
        className={classes.navItem}
        activeProps={{ className: classes.navItemActive }}
        to="/$root/$"
        params={{ root: favorite.root, _splat: favorite.path }}
        label={favorite.name}
        color="gray"
        rightSection={
          <CloseButton
            className={classes.remove}
            size="xs"
            onClick={remove}
            aria-label={LL.sidebar.removeFavorite({ name: favorite.name })}
          />
        }
      />
    </div>
  )
}

export function Favorites() {
  const { LL } = useI18nContext()
  const { items, remove } = useFavorites()

  if (!items.length) return null

  return (
    <Stack gap={4}>
      <Text size="xs" fw={600} c="dimmed">
        {LL.sidebar.favorites()}
      </Text>
      {items.map((favorite) => (
        <FavoriteItem
          key={favorite.id}
          favorite={favorite}
          onRemove={(id) => remove.mutate(id)}
        />
      ))}
    </Stack>
  )
}
