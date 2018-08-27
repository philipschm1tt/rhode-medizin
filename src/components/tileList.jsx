import styled from 'styled-components'

const TileList = styled.div`
  > * {
    margin-bottom: ${props => props.theme.sizes.baseLineHeight};
  }
`

export default TileList
