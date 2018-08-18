import styled from 'styled-components'

const ContentBox = styled.div`
  padding: ${props =>
      props.extraVerticalPadding
        ? props.theme.sizes.outerPadding
        : props.theme.sizes.innerPadding}
    ${props => props.theme.sizes.innerPadding};
`

export default ContentBox
