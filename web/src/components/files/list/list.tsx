import { Table } from '@mantine/core'

import type { Entry } from '@domain'

export type ListProps = {
  data?: Entry[]
  onOpen: (item: Entry) => void
}

export function List({ data, onOpen }: ListProps) {
  const rows = data?.map((element) => (
    <Table.Tr key={element.name} onClick={() => onOpen(element)}>
      <Table.Td>{element.name}</Table.Td>
      <Table.Td>{element.size}</Table.Td>
    </Table.Tr>
  ))

  return (
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Name</Table.Th>
          <Table.Th>Size</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>{rows}</Table.Tbody>
    </Table>
  )
}
