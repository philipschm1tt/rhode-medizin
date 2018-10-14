import styled from 'styled-components'

const TileList = styled.ul`
  > * {
    list-style: none;
    max-width: 100%;
    margin-bottom: ${props => props.theme.sizes.baseLineHeight};
  }
`

export default TileList
