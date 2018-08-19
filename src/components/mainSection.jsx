import styled from 'styled-components'
import { MainGridColumns } from './mainGrid'

const MainSection = styled.section`
  padding: ${props => props.theme.sizes.outerPadding};
  background-color: ${props =>
    props.darkBackground
      ? props.theme.colors.purple
      : props.theme.colors.lightYellow};

  grid-column: ${props =>
    props.fullWidth ? MainGridColumns.fullWidth : MainGridColumns.mainColumn};

  @media (min-width: ${props => props.theme.sizes.breakpoints.large}) {
    @supports (display: grid) {
      padding: ${props =>
          props.fullWidth ? props.theme.sizes.innerPadding : '0'}
        0;
    }
  }

  h2 {
    color: ${props =>
      props.darkBackground
        ? props.theme.colors.lightYellow
        : props.theme.colors.companyBlue};
  }
`

export default MainSection
