const markdownIt = require("markdown-it");
const markdownItFootnote = require("markdown-it-footnote");
const markdownImplicitFigures = require("markdown-it-implicit-figures");
const { EleventyHtmlBasePlugin } = require("@11ty/eleventy");

module.exports = function (eleventyConfig) {
  // configure markdown library to use custom plugins
  const markdownLib = markdownIt({
    html: true,
    linkify: true,
  })
    .use(markdownItFootnote) // add footnote plugin
    .use(markdownImplicitFigures, { figcaption: true }); // add implicit figures
  eleventyConfig.setLibrary("md", markdownLib);

  // copy assets from public/ directory to root of site build
  eleventyConfig.addPassthroughCopy({ public: "/" });

  // add base plugin to allow deployment to GitHub Pages subfolder
  eleventyConfig.addPlugin(EleventyHtmlBasePlugin);

  // add filter to normalize links to array of objects with url and text properties
  eleventyConfig.addFilter("normalizeLinks", function (links) {
    if (typeof links === "undefined") return;
    if (!Array.isArray(links)) {
      throw new Error(
        "links must be an array of urls or objects with url and text properties"
      );
    }
    return links.map((link) => {
      if (typeof link === "string") {
        return { url: link, text: link };
      }
      if (typeof link === "object") {
        if (typeof link.url === "undefined") {
          throw new Error("link object must have url property");
        }
        if (typeof link.text === "undefined") {
          throw new Error("link object must have text property");
        }
        return link;
      }
      throw new Error("link must be a string or object");
    });
  });

  // Copy media from their source folders to their respective published folders.
  
  // Copy all HTML files that aren't index.html.
  // index.html files needing to be rendered should all have frontmatter so they 
  // are indeed rendered, but they're excluded here so the rendered file isn't
  // overwritten by the passthrough copy operation.
  eleventyConfig.addPassthroughCopy("transcripts/**/!(index).html");

  eleventyConfig.addPassthroughCopy("transcripts/**/*.png");
  eleventyConfig.addPassthroughCopy("transcripts/**/*.jpg");
  eleventyConfig.addPassthroughCopy("transcripts/**/*.jpeg");
  eleventyConfig.addPassthroughCopy("transcripts/**/*.gif");
  eleventyConfig.addPassthroughCopy("transcripts/**/*.cur");
  
  eleventyConfig.addPassthroughCopy("transcripts/**/*.mov");
  eleventyConfig.addPassthroughCopy("transcripts/**/*.mp3");
  eleventyConfig.addPassthroughCopy("transcripts/**/*.mp4");

  eleventyConfig.addPassthroughCopy("transcripts/**/*.js");
  eleventyConfig.addPassthroughCopy("transcripts/**/*.css");

  eleventyConfig.addPassthroughCopy("transcripts/**/*.obj");
  eleventyConfig.addPassthroughCopy("transcripts/**/*.csv");
  eleventyConfig.addPassthroughCopy("transcripts/**/*.geojson");
  
  eleventyConfig.addPassthroughCopy("transcripts/**/*.eot");
  eleventyConfig.addPassthroughCopy("transcripts/**/*.ttf");
  eleventyConfig.addPassthroughCopy("transcripts/**/*.woff");
  eleventyConfig.addPassthroughCopy("transcripts/**/*.woff2");

  return {
    dir: {
      // ⚠️ These values are both relative to your input directory.
      includes: "_includes",
      layouts: "_layouts"
    }
  }
};