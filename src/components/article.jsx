import styled from 'styled-components'

const Article = styled.article

export default Article`
  grid-column: 1 / -1;

  display: grid;
  grid-template-columns:
    minmax(auto, 1fr)
    [main-column-start] 4.854fr [main-column-end side-column-start] 3fr [side-column-end]
    minmax(auto, 1fr);
`
