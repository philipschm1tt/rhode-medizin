import styled from 'styled-components'

const TileList = styled.div`
  > * {
    margin-bottom: ${props => props.theme.sizes.baseLineHeight};
  }

  @supports (display: grid) {
    display: grid;
    grid-auto-rows: 1fr;
  }
`

export default TileList
