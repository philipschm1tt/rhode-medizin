import styled from 'styled-components'

const Article = styled.article

export default Article`
  grid-column: 1 / -1;
  grid-row: 2;

  display: grid;
  grid-template-columns:
    1.618fr
    [main-column-start] 4.854fr [main-column-end side-column-start] 3fr [side-column-end]
    1fr;
`
