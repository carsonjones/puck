class Puck < Formula
  desc "NHL Terminal UI for real-time stats and game tracking"
  homepage "https://github.com/jones/nhl-tui"
  url "https://registry.npmjs.org/puck/-/puck-0.1.0.tgz"
  sha256 "" # CALCULATE AFTER FIRST npm publish: shasum -a 256 puck-0.1.0.tgz
  license "MIT"

  depends_on "bun"

  def install
    # npm tarball extracts to package/
    libexec.install Dir["package/*"]
    bin.install_symlink libexec/"dist/index.js" => "puck"
  end

  test do
    system bin/"puck", "--skip-version-check", "--help"
  end
end
