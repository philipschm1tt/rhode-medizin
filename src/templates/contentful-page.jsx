import React from 'react'
import PropTypes from 'prop-types'
import { graphql } from 'gatsby'

import Layout from '../components/layout'
import Quote from '../components/quote'
import TileGrid from '../components/tileGrid'
import TileList from '../components/tileList'
import EmployeeTile from '../components/employeeTile'
import ProductGroup from '../components/productGroup'
import HeroBlock from '../components/heroBlock'
import MainSection from '../components/mainSection'
import AsideSection from '../components/asideSection'
import ContentBox from '../components/contentBox'
import MainGrid from '../components/mainGrid'

const ModuleTemplate = ({ module }) => {
  let component
  switch (module.__typename) {
    case 'ContentfulHeroBlock':
      component = (
        <HeroBlock
          mainHeadline={module.hauptueberschrift}
          subHeadline={module.unterueberschrift}
          callToAction={module.callToAction.text}
          image={module.bild.fixed.src}
        />
      )
      break
    case 'ContentfulZitat':
      component = <Quote text={module.zitat} />
      break
    case 'ContentfulAbschnitt':
      component = module.volleBreite ? (
        <MainSection darkBackground="true" fullWidth="true">
          <MainGrid>
            <ModuleTemplate module={module.inhalte[0]} />
          </MainGrid>
        </MainSection>
      ) : (
        <>
          <MainSection>
            <ModuleTemplate module={module.inhalte[0]} />
          </MainSection>
          {module.seitenabschnitt && (
            <AsideSection>
              <ModuleTemplate module={module.seitenabschnitt} />
            </AsideSection>
          )}
        </>
      )
      break
    case 'ContentfulTextinhalt':
      component = (
        <ContentBox
          dangerouslySetInnerHTML={{
            __html:
              module.childContentfulTextinhaltTextTextNode.childMarkdownRemark
                .html,
          }}
        />
      )
      break
    case 'ContentfulKartenLayout':
      component = (
        <ContentBox>
          <h2>{module.titel}</h2>
          {module.layout === 'Gitter' ? (
            <TileGrid>
              {module.elemente.map(element => (
                <li>
                  <ModuleTemplate module={element} key={element.name} />
                </li>
              ))}
            </TileGrid>
          ) : (
            <TileList>
              {module.elemente.map(element => (
                <li>
                  <ModuleTemplate module={element} key={element.name} />
                </li>
              ))}
            </TileList>
          )}
        </ContentBox>
      )
      break
    case 'ContentfulMitarbeiter':
      component = (
        <EmployeeTile
          name={module.name}
          department={module.dienstbereich}
          photo={module.foto.fixed}
          key={module.name}
        />
      )
      break
    case 'ContentfulProduktgruppe':
      component = (
        <ProductGroup
          name={module.name}
          description={module.beschreibung.beschreibung}
          examples={module.beispiele}
          photo={module.foto.fluid}
          key={module.name}
        />
      )
      break
    default:
      component = null
  }
  return component
}

const ContentfulPageTemplate = ({ data }) => {
  const seite = data.contentfulSeite
  return (
    <Layout>
      {seite.module.map(module => (
        <ModuleTemplate module={module} key={module.id} />
      ))}
    </Layout>
  )
}

ContentfulPageTemplate.propTypes = {
  data: PropTypes.object.isRequired,
}

export default ContentfulPageTemplate

export const pageQuery = graphql`
  query($slug: String!) {
    contentfulSeite(slug: { eq: $slug }) {
      slug
      module {
        __typename
        ... on ContentfulHeroBlock {
          id
          hauptueberschrift
          unterueberschrift
          callToAction {
            text
          }
          bild {
            fixed(width: 1600) {
              src
              srcSet
              srcWebp
              srcSetWebp
            }
          }
        }
        ... on ContentfulZitat {
          id
          zitat
        }
        ... on ContentfulAbschnitt {
          id
          volleBreite
          inhalte {
            __typename
            ... on ContentfulTextinhalt {
              childContentfulTextinhaltTextTextNode {
                childMarkdownRemark {
                  html
                }
              }
            }
            ... on ContentfulKartenLayout {
              id
              titel
              layout
              elemente {
                __typename
                ... on ContentfulMitarbeiter {
                  name
                  dienstbereich
                  foto {
                    fixed(width: 160, height: 182) {
                      ...GatsbyContentfulFixed_withWebp
                    }
                  }
                }
                ... on ContentfulProduktgruppe {
                  name
                  beschreibung {
                    beschreibung
                  }
                  beispiele
                  foto {
                    fluid(maxWidth: 700) {
                      ...GatsbyContentfulFluid_withWebp
                    }
                  }
                }
              }
            }
          }
          seitenabschnitt {
            __typename
            ... on ContentfulTextinhalt {
              childContentfulTextinhaltTextTextNode {
                childMarkdownRemark {
                  html
                }
              }
            }
          }
        }
      }
    }
  }
`
