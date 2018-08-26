import React from 'react'
import PropTypes from 'prop-types'
import { graphql } from 'gatsby'

import Layout from '../components/layout'
import Article from '../components/article'
import MainSection from '../components/mainSection'
import ContentBox from '../components/contentBox'

const ImprintPage = props => (
  <Layout>
    <Article>
      <MainSection>
        <ContentBox
          dangerouslySetInnerHTML={{
            __html:
              props.data.imprint.abschnitte[0]
                .childContentfulTextabschnittTextTextNode.childMarkdownRemark
                .html,
          }}
        />
      </MainSection>
    </Article>
  </Layout>
)

ImprintPage.propTypes = {
  data: PropTypes.object.isRequired,
}

export default ImprintPage

export const pageQuery = graphql`
  query {
    imprint: contentfulSeite(slug: { eq: "imprint" }) {
      abschnitte {
        __typename
        ... on ContentfulTextabschnitt {
          childContentfulTextabschnittTextTextNode {
            childMarkdownRemark {
              html
            }
          }
        }
      }
    }
  }
`
