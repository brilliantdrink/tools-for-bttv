// https://gist.github.com/IceCreamYou/8396172

export function damerauLevenshteinDistance(source: string, target: string) {
  if (!source) return target ? target.length : 0
  else if (!target) return source.length

  const sourceLength = source.length,
    targetLength = target.length,
    bothLength = sourceLength + targetLength,
    score: Array<Array<number>> = new Array(sourceLength + 2),
    sd: Record<string, number> = {}
  for (let i = 0; i < score.length; i++) score[i] = new Array(targetLength + 2)
  score[0][0] = bothLength
  for (let i = 0; i <= sourceLength; i++) {
    score[i + 1][1] = i
    score[i + 1][0] = bothLength
    sd[source[i]] = 0
  }
  for (let j = 0; j <= targetLength; j++) {
    score[1][j + 1] = j
    score[0][j + 1] = bothLength
    sd[target[j]] = 0
  }

  for (let i = 1; i <= sourceLength; i++) {
    let DB = 0
    for (let j = 1; j <= targetLength; j++) {
      const i1 = sd[target[j - 1]],
        j1 = DB
      if (source[i - 1] === target[j - 1]) {
        score[i + 1][j + 1] = score[i][j]
        DB = j
      } else {
        score[i + 1][j + 1] = Math.min(score[i][j], score[i + 1][j], score[i][j + 1]) + 1
      }
      score[i + 1][j + 1] = Math.min(score[i + 1][j + 1], score[i1] ? score[i1][j1] + (i - i1 - 1) + 1 + (j - j1 - 1) : Infinity)
    }
    sd[source[i - 1]] = i
  }
  return score[sourceLength + 1][targetLength + 1]
}

export function optimalStringAlignmentDistance(s: string, t: string) {
  // Determine the "optimal" string-alignment distance between s and t
  if (!s || !t) {
    return 99;
  }
  var m = s.length;
  var n = t.length;

  /* For all i and j, d[i][j] holds the string-alignment distance
   * between the first i characters of s and the first j characters of t.
   * Note that the array has (m+1)x(n+1) values.
   */
  var d = new Array();
  for (var i = 0; i <= m; i++) {
    d[i] = new Array();
    d[i][0] = i;
  }
  for (var j = 0; j <= n; j++) {
    d[0][j] = j;
  }

  // Determine substring distances
  var cost = 0;
  for (var j = 1; j <= n; j++) {
    for (var i = 1; i <= m; i++) {
      cost = (s.charAt(i - 1) == t.charAt(j - 1)) ? 0 : 1;   // Subtract one to start at strings' index zero instead of index one
      d[i][j] = Math.min(d[i][j - 1] + 1,                  // insertion
        Math.min(d[i - 1][j] + 1,         // deletion
          d[i - 1][j - 1] + cost));  // substitution

      if (i > 1 && j > 1 && s.charAt(i - 1) == t.charAt(j - 2) && s.charAt(i - 2) == t.charAt(j - 1)) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost); // transposition
      }
    }
  }

  // Return the strings' distance
  return d[m][n];
}
