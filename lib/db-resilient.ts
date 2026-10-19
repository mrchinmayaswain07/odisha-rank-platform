/**
 * Resilient Database Operations Helper
 * Gracefully handles database schema mismatches (e.g. missing optional columns)
 * by detecting PostgREST schema cache errors and retrying without the unrecognized fields.
 */

const MISSING_COLUMN_REGEXES = [
  /Could not find the ['"]?([a-zA-Z0-9_]+)['"]? column of/i,
  /column ["']?([a-zA-Z0-9_]+)["']? of relation/i,
  /column ["']?([a-zA-Z0-9_]+)["']? does not exist/i,
  /Could not find the property ['"]?([a-zA-Z0-9_]+)['"]?/i,
];

function extractMissingColumn(errorMessage: string): string | null {
  for (const regex of MISSING_COLUMN_REGEXES) {
    const match = errorMessage.match(regex);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

function stripProperty(objOrArray: any, prop: string): any {
  if (Array.isArray(objOrArray)) {
    return objOrArray.map((item) => stripProperty(item, prop));
  }
  if (objOrArray && typeof objOrArray === "object") {
    const copy = { ...objOrArray };
    delete copy[prop];
    return copy;
  }
  return objOrArray;
}

/**
 * Executes a Supabase insert, automatically stripping unsupported columns and retrying.
 */
export async function resilientInsert(
  client: any,
  tableName: string,
  initialPayload: Record<string, any> | Record<string, any>[],
  maxRetries: number = 8
): Promise<{ data: any; error: any }> {
  let currentPayload = Array.isArray(initialPayload)
    ? initialPayload.map((item) => ({ ...item }))
    : { ...initialPayload };

  // Table specific adjustments for schema backwards compatibility
  if (tableName === "study_materials") {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const adjust = (item: any) => {
      const copy = { ...item };
      // 1. Ensure valid UUID id if present, otherwise strip it to let DB generate gen_random_uuid()
      if (copy.id && !uuidRegex.test(copy.id)) {
        delete copy.id;
      }
      // 2. Ensure topic_id is a valid UUID (NOT NULL in schema)
      if (!copy.topic_id || !uuidRegex.test(copy.topic_id)) {
        copy.topic_id = "c1111111-1111-1111-1111-111111111111";
      }
      // 3. Ensure material_type is strictly one of 'link', 'summary', 'text', 'note'
      let mType = (copy.material_type || "").toLowerCase();
      if (mType === "pdf" || copy.category?.toLowerCase() === "pdf" || copy.file_url || copy.url) {
        mType = "link";
      } else if (mType !== "link" && mType !== "summary" && mType !== "text" && mType !== "note") {
        mType = "note";
      }
      copy.material_type = mType;
      // 4. Ensure foreign key UUIDs are valid or null
      if (copy.exam_id && !uuidRegex.test(copy.exam_id)) copy.exam_id = null;
      if (copy.subject_id && !uuidRegex.test(copy.subject_id)) copy.subject_id = null;
      if (copy.chapter_id && !uuidRegex.test(copy.chapter_id)) copy.chapter_id = null;
      // 5. Ensure url and content are valid
      copy.url = copy.file_url || copy.url || null;
      copy.file_url = copy.file_url || copy.url || null;
      copy.content = copy.content || copy.description || copy.title || "Study material notes";
      copy.is_official = copy.is_official ?? true;
      copy.status = copy.status || "published";
      return copy;
    };
    currentPayload = Array.isArray(currentPayload)
      ? currentPayload.map(adjust)
      : adjust(currentPayload);
  }

  if (tableName === "mock_tests") {
    const adjust = (item: any) => ({
      is_published: item.status === "published" || (item.is_published ?? true),
      ...item,
    });
    currentPayload = Array.isArray(currentPayload)
      ? currentPayload.map(adjust)
      : adjust(currentPayload);
  }

  if (tableName === "exams") {
    const adjust = (item: any) => ({
      is_active: item.status === "published" || (item.is_active ?? true),
      ...item,
    });
    currentPayload = Array.isArray(currentPayload)
      ? currentPayload.map(adjust)
      : adjust(currentPayload);
  }

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const query = client.from(tableName).insert(currentPayload);
    const { data, error } = Array.isArray(currentPayload)
      ? await query.select()
      : await query.select().single();

    if (!error) {
      return { data, error: null };
    }

    const missingCol = extractMissingColumn(error.message);
    if (missingCol) {
      console.warn(`[resilientInsert] Table '${tableName}' missing column '${missingCol}'. Stripping and retrying...`);
      currentPayload = stripProperty(currentPayload, missingCol);
      continue;
    }

    // Unrecognized or fatal error
    return { data: null, error };
  }

  return { data: null, error: new Error(`Failed to insert into ${tableName} after stripping missing columns`) };
}

/**
 * Executes a Supabase update, automatically stripping unsupported columns and retrying.
 */
export async function resilientUpdate(
  client: any,
  tableName: string,
  id: string,
  initialPayload: Record<string, any>,
  maxRetries: number = 8
): Promise<{ data: any; error: any }> {
  let currentPayload = { ...initialPayload };

  if (tableName === "mock_tests" && currentPayload.status !== undefined) {
    currentPayload.is_published = currentPayload.status === "published";
  }

  if (tableName === "exams" && currentPayload.status !== undefined) {
    currentPayload.is_active = currentPayload.status === "published";
  }

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const { data, error } = await client
      .from(tableName)
      .update(currentPayload)
      .eq("id", id)
      .select()
      .single();

    if (!error) {
      return { data, error: null };
    }

    const missingCol = extractMissingColumn(error.message);
    if (missingCol) {
      console.warn(`[resilientUpdate] Table '${tableName}' missing column '${missingCol}'. Stripping and retrying...`);
      currentPayload = stripProperty(currentPayload, missingCol);
      continue;
    }

    return { data: null, error };
  }

  return { data: null, error: new Error(`Failed to update ${tableName} after stripping missing columns`) };
}
