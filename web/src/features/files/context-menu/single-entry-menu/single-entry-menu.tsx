import { useI18nContext } from '@i18n'

import { Menu } from '@mantine/core'

import type { Entry } from '@domain'

import classes from '../context-menu.module.css'
import type { ContextMenuState } from '../hooks'
import { EntryHeader, Shortcut } from '../menu-parts'

type SingleEntryMenuProps = {
  entry: Entry
  state: ContextMenuState
  onOpen: (entry: Entry) => void
  onQuickLook: () => void
  onPreview: () => void
  onRename: (entry: Entry) => void
}

export function SingleEntryMenu({
  entry,
  state,
  onOpen,
  onQuickLook,
  onPreview,
  onRename,
}: SingleEntryMenuProps) {
  const { LL } = useI18nContext()
  const {
    openHref,
    copy,
    cut,
    paste,
    hasClipboard,
    duplicate,
    isFavorite,
    toggleFavorite,
    downloadHref,
    share,
    linkCopied,
    openTrash,
  } = state

  return (
    <>
      <EntryHeader entry={entry} />

      {entry.is_dir ? (
        <Menu.Item
          onClick={() => onOpen(entry)}
          rightSection={<Shortcut id="open" />}
        >
          {LL.common.open()}
        </Menu.Item>
      ) : (
        <Menu.Item
          component="a"
          href={openHref(entry)}
          target="_blank"
          rel="noreferrer"
          rightSection={<Shortcut id="open" />}
        >
          {LL.menu.openInNewTab()}
        </Menu.Item>
      )}

      <Menu.Item
        disabled={entry.is_dir}
        onClick={onQuickLook}
        rightSection={<Shortcut id="quickLook" />}
      >
        {LL.menu.quickLook()}
      </Menu.Item>
      <Menu.Item
        disabled={entry.is_dir}
        onClick={onPreview}
        rightSection={<Shortcut id="fullscreen" />}
      >
        {LL.menu.fullScreen()}
      </Menu.Item>

      <Menu.Divider />

      <Menu.Item
        onClick={() => copy([entry])}
        rightSection={<Shortcut id="copy" />}
      >
        {LL.common.copy()}
      </Menu.Item>
      <Menu.Item
        onClick={() => cut([entry])}
        rightSection={<Shortcut id="cut" />}
      >
        {LL.common.cut()}
      </Menu.Item>
      <Menu.Item
        disabled={!hasClipboard}
        onClick={paste}
        rightSection={<Shortcut id="paste" />}
      >
        {LL.common.paste()}
      </Menu.Item>
      <Menu.Item
        onClick={() => duplicate([entry])}
        rightSection={<Shortcut id="duplicate" />}
      >
        {LL.common.duplicate()}
      </Menu.Item>

      <Menu.Divider />

      {entry.is_dir && (
        <Menu.Item onClick={() => toggleFavorite(entry)}>
          {isFavorite(entry) ? LL.menu.removeFavorite() : LL.menu.addFavorite()}
        </Menu.Item>
      )}
      <Menu.Item onClick={() => onRename(entry)}>
        {LL.common.rename()}
      </Menu.Item>
      <Menu.Item
        component="a"
        href={downloadHref(entry, true)}
        disabled={entry.is_dir}
        rightSection={<Shortcut id="download" />}
      >
        {LL.common.download()}
      </Menu.Item>
      <Menu.Item disabled={entry.is_dir} onClick={() => share(entry)}>
        {linkCopied ? LL.menu.linkCopied() : LL.menu.shareEllipsis()}
      </Menu.Item>

      <Menu.Divider />

      <Menu.Item
        className={classes.danger}
        onClick={() => openTrash([entry])}
        rightSection={<Shortcut id="trash" />}
      >
        {LL.menu.moveToTrash()}
      </Menu.Item>
    </>
  )
}
