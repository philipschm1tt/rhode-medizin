import styled from 'styled-components'

export const MainGridColumns = {
  leftEdge: '1',
  rightEdge: '5',
  mainColumn: 'main-column-start / main-column-end',
  mainColumnStart: 'main-column-start',
  mainColumnEnd: 'main-column-end',
  sideColumn: 'side-column-start / side-column-end',
  sideColumnStart: 'side-column-start',
  sideColumnEnd: 'side-column-end',
  fullWidth: '1 / 5',
}

const MainGrid = styled.div`
  grid-column: ${MainGridColumns.fullWidth};
  grid-row: ${props => props.gridRow || 'auto'};

  @media (min-width: ${props => props.theme.sizes.breakpoints.large}) {
    display: flex; /* fallback – justify-self still works */
    flex-direction: column;
    display: grid;
    grid-template-columns:
      1.618fr
      [main-column-start] 4.854fr [main-column-end side-column-start] 3fr [side-column-end]
      1fr;
    justify-items: stretch;
  }

  > * {
    grid-column: main-column-start / side-column-end;
  }
`

export default MainGrid
