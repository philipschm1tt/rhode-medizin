import styled from 'styled-components'

const MainSection = styled.section`
  padding: 20px;
  background-color: ${props =>
    props.darkBackground
      ? props.theme.colors.purple
      : props.theme.colors.lightYellow};

  h2 {
    color: ${props =>
      props.darkBackground
        ? props.theme.colors.lightYellow
        : props.theme.colors.companyBlue};
  }
`

export default MainSection
