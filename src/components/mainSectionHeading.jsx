import styled from 'styled-components'

const MainSectionHeading = styled.h2`
  background-color: ${props =>
    props.darkBackground
      ? props.theme.colors.purple
      : props.theme.colors.lightYellow};
`

export default MainSectionHeading
