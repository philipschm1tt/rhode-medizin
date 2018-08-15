import styled from 'styled-components'

const TileList = styled.div`
  display: flex;
  flex-wrap: wrap;

  > * {
    margin-bottom: ${props => props.theme.sizes.baseLineHeight};
    margin-right: ${props => props.theme.sizes.baseLineHeight};
  }
`

export default TileList
