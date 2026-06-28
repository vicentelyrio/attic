import { Table } from '@mantine/core'

import { relativeTime, size, fileKind, FOLDER_KIND } from '@infrastructure'
import type { Entry } from '@domain'

export type ListProps = {
  data?: Entry[]
  onOpen: (item: Entry) => void
}

export function List({ data, onOpen }: ListProps) {
  const rows = data?.map((element) => (
    <Table.Tr key={element.name} onClick={() => onOpen(element)}>
      <Table.Td>
        {element.name}
        {element.is_dir && `(${element.items})`}
      </Table.Td>
      <Table.Td>{size(element.size)}</Table.Td>
      <Table.Td>{element.is_dir ? FOLDER_KIND.label : fileKind(element.name).label}</Table.Td>
      <Table.Td>{relativeTime(element.created)}</Table.Td>
      <Table.Td>{relativeTime(element.modified)}</Table.Td>
    </Table.Tr>
  ))

  return (
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Name</Table.Th>
          <Table.Th>Size</Table.Th>
          <Table.Th>Created</Table.Th>
          <Table.Th>Modified</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>{rows}</Table.Tbody>
    </Table>
  )
}
